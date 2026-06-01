import sys
import os

# backend 폴더 내부의 모듈(api, core, models 등)을 루트에서도 찾을 수 있도록 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from contextlib import asynccontextmanager

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

import uuid
from datetime import date
from fastapi import FastAPI, HTTPException, Depends


def _parse_date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=400, detail="올바르지 않은 날짜 형식입니다. YYYY-MM-DD 형식이어야 합니다.")
from pydantic import BaseModel
from sqlalchemy.orm import Session
from AI_routers.ai_log import StatResponse, analyze_log_to_stats, router as ai_router
from fastapi.middleware.cors import CORSMiddleware
from api import auth, users, analytics, quizzes
from api.users import get_current_user
from services.oauth import close_http_client
from api import parties, avatars
from core.db import Base, engine, get_db
import models.user
import models.oauth_account
import models.refresh_token
import models.study_session
import models.user_quiz
import models.character
import models.user_stats
import models.guild
import models.daily_quest
import models.party
import models.avatar
import models.user_character
from models.study_session import StudySession
from models.user_stats import UserAiStat


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield
    await close_http_client()


app = FastAPI(title="Statlog API", lifespan=lifespan)

# 프론트엔드 로컬 개발 주소 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",  # Vite 개발 서버 (vite.config.ts의 server.port)
	"http://54.180.155.190:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(parties.router, prefix="/api/v1")
app.include_router(avatars.router, prefix="/api/v1")
app.include_router(quizzes.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "ok"}

# --- API 엔드포인트 ---

# 스탯 클래스는 /AI_routers/ai_log.py(StatResponse)로 이동.
# 프로필 조회(/users/me)는 api/users.py 라우터가 실제 DB 기반으로 처리한다.

# 학습 세션 저장 (StudyModal용)
class StudySessionRequest(BaseModel):
    subject: str
    content: str
    duration_minutes: int
    date: str
    quiz_results: list[bool] | None = None

@app.get("/api/v1/study/sessions")
async def get_study_sessions(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(StudySession)
        .filter_by(user_id=current_user.id)
        .order_by(StudySession.date.asc())
        .all()
    )
    return [
        {
            "id": s.id,
            "subject": s.subject,
            "content": s.content,
            "duration_minutes": s.duration_minutes,
            "date": s.date.isoformat() if s.date else None,
        }
        for s in sessions
    ]


@app.post("/api/v1/study/sessions", status_code=201)
async def save_study_session(
    session: StudySessionRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import logging as _logging
    _logger = _logging.getLogger("main.study_sessions")

    try:
        stat_gained = await analyze_log_to_stats(
            session.content, session.duration_minutes, session.quiz_results
        )
    except Exception as e:
        _logger.error("[StatDebug] analyze_log_to_stats 실패: %s: %s", type(e).__name__, e)
        stat_gained = StatResponse()

    gained = stat_gained.model_dump()

    record = StudySession(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        subject=session.subject,
        content=session.content,
        duration_minutes=session.duration_minutes,
        date=_parse_date(session.date),
        stat_gained=gained,
        quiz_results=session.quiz_results,
    )
    db.add(record)

    # 획득 스탯을 서버가 직접 누적·영속화한다 (진실의 원천 = 서버).
    # AI 스탯은 user_ai_stats 테이블에, 유저 레벨용 exp는 users.exp 컬럼에 누적.
    ai_stat = db.query(UserAiStat).filter_by(user_id=current_user.id).first()
    if ai_stat is None:
        ai_stat = UserAiStat(user_id=current_user.id)
        db.add(ai_stat)
    for key in ("HUM", "SOC", "NAT", "COL", "PER", "ART", "EXP"):
        setattr(ai_stat, key, int(getattr(ai_stat, key) or 0) + int(gained.get(key, 0)))
    current_user.exp = int(current_user.exp or 0) + int(gained.get("EXP", 0))

    db.commit()

    _logger.info(
        "[StatDebug] 세션 저장 완료 — stat_gained: %s | user.exp=%d ai_stat.EXP=%d",
        stat_gained, current_user.exp, ai_stat.EXP,
    )
    return {
        "id": record.id,
        "subject": record.subject,
        "stat_gained": stat_gained,
    }
