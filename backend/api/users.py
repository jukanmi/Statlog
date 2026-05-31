from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from core.db import get_db
from core.security import decode_access_token
from schemas.user import UserUpdateRequest, serialize_user
from models.user import User
from models.study_session import StudySession
from AI_routers.ai_service import AIService
from services.portfolio_pdf import render_portfolio_pdf

# 포트폴리오 LLM 입력에 포함할 최근 학습 기록 개수.
_PORTFOLIO_RECENT_SESSIONS = 15


router = APIRouter(prefix="/users", tags=["Users"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/dev-login", auto_error=False)


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter_by(id=user_id).first()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    if not token:
        raise HTTPException(status_code=401, detail="인증 토큰이 없습니다")

    try:
        payload = decode_access_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="토큰에 user_id가 없습니다")

    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="유저를 찾을 수 없습니다")

    return user


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return serialize_user(current_user)


@router.patch("/me")
async def update_me(
    body: UserUpdateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed_fields = {"nickname", "profile_image"}
    for field, value in body.model_dump(exclude_none=True).items():
        if field in allowed_fields:
            setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)


def _build_portfolio_input(
    user: User, sessions: list[StudySession]
) -> tuple[str, dict[str, int]]:
    """유저 스탯·학습 기록을 LLM 입력용 한국어 텍스트로 조립한다.

    반환: (log_text, 과목별 총 학습시간(분) 맵).
    """
    stats = user.ai_stats or user.stats or {}
    subject_minutes: dict[str, int] = {}
    for s in sessions:
        subject_minutes[s.subject] = subject_minutes.get(s.subject, 0) + (s.duration_minutes or 0)

    lines: list[str] = []
    lines.append(f"학습자: {user.nickname} (레벨 {user.level}, EXP {user.exp})")
    lines.append(f"연속 학습일: {user.study_streak}일")

    stat_parts = [f"{k}={int(stats.get(k, 0) or 0)}" for k in ("HUM", "SOC", "NAT", "COL", "PER", "ART")]
    lines.append("6대 능력치(%): " + ", ".join(stat_parts))

    if subject_minutes:
        sub_parts = [
            f"{subj} {mins}분"
            for subj, mins in sorted(subject_minutes.items(), key=lambda kv: kv[1], reverse=True)
        ]
        lines.append("과목별 총 학습시간: " + ", ".join(sub_parts))

    recent = sessions[-_PORTFOLIO_RECENT_SESSIONS:]
    if recent:
        lines.append("")
        lines.append("최근 학습 기록:")
        for s in recent:
            content = (s.content or "").strip().replace("\n", " ")
            if len(content) > 200:
                content = content[:200] + "…"
            lines.append(f"- [{s.date}] {s.subject} ({s.duration_minutes or 0}분): {content}")

    return "\n".join(lines), subject_minutes


@router.get("/me/portfolio/download")
async def download_portfolio(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """학습 능력·스테이터스·기록 기반 취업용 포트폴리오를 PDF로 생성해 반환한다.

    프론트(downloadPortfolioPdf)와 계약: application/pdf Blob 응답.
    """
    sessions = (
        db.query(StudySession)
        .filter_by(user_id=current_user.id)
        .order_by(StudySession.date.asc())
        .all()
    )
    if not sessions:
        raise HTTPException(status_code=400, detail="포트폴리오를 생성할 학습 기록이 없습니다. 먼저 학습을 기록해주세요.")
    log_text, subject_minutes = _build_portfolio_input(current_user, sessions)

    payload = await AIService.request_portfolio_generation(log_text)

    pdf_bytes = render_portfolio_pdf(
        payload,
        nickname=current_user.nickname,
        level=int(current_user.level or 1),
        exp=int(current_user.exp or 0),
        ai_stats=current_user.ai_stats or current_user.stats or {},
        subject_minutes=subject_minutes,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=portfolio.pdf"},
    )


