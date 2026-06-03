import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from pydantic import BaseModel

from schemas.analytics import AnonymousStudySession
from api.users import get_current_user
from core.db import get_db
from models.user_stats import UserAiStat
from models.user import User

# 로거 설정
logger = logging.getLogger("analytics")
logger.setLevel(logging.INFO)
file_handler = logging.FileHandler("anonymous_analytics.log")
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
if not logger.handlers:
    logger.addHandler(file_handler)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

VALID_CATEGORIES = {"HUM", "SOC", "NAT", "COL", "PER", "ART", "EXP"}


class RankingItem(BaseModel):
    userId: str
    nickname: str
    rank: int
    percentage: float
    category: str


@router.get("/rankings", response_model=List[RankingItem])
def get_category_rankings(
    category: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 카테고리: {category}")

    col = getattr(UserAiStat, category)
    rows = (
        db.query(UserAiStat, User)
        .join(User, User.id == UserAiStat.user_id)
        .order_by(col.desc())
        .all()
    )

    total = len(rows)
    result = []
    for rank, (stat, user) in enumerate(rows, start=1):
        value = int(getattr(stat, category) or 0)
        percentage = round((1 - (rank - 1) / total) * 100, 1) if total > 0 else 100.0
        result.append(RankingItem(
            userId=user.id,
            nickname=user.nickname,
            rank=rank,
            percentage=percentage,
            category=category,
        ))
    return result


@router.post("/study-session", status_code=201)
async def log_study_session(session: AnonymousStudySession):
    """
    익명화된 학습 세션 데이터를 기록합니다.
    이 데이터에는 사용자 식별 정보가 포함되지 않으며, 앱 통계 및 개선 목적으로만 사용됩니다.
    """
    # 파일 로그에 저장
    logger.info(f"Subject: {session.subject}, Duration: {session.duration_minutes}m, Timestamp: {session.timestamp}")
    
    return {"status": "ok"}
