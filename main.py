import sys
import os

# backend 폴더 내부의 모듈(api, core, models 등)을 루트에서도 찾을 수 있도록 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from contextlib import asynccontextmanager

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

import uuid
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
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
from models.study_session import StudySession


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

# --- 데이터 모델 (프론트 명세서 기반) ---

# 스탯클래스 /AI_routers/ai_log.py로 이동

class User(BaseModel):
    id: str
    nickname: str
    profile_image: Optional[str] = None
    stats: StatResponse
    gold: int
    gems: int
    level: int
    exp: int

# --- API 엔드포인트 ---

# 1. 내 프로필 조회 (Dashboard용)
@app.get("/api/v1/users/me", response_model=User)
async def get_my_profile():
    # 실제 DB 연동 전까지 줄 가짜 데이터
    return {
        "id": "user-001",
        "nickname": "학습왕",
        "stats": {"HUM": 50, "SOC": 0, "NAT": 10, "COL": 0, "PER": 0, "ART": 0},
        "gold": 1000,
        "gems": 50,
        "level": 1,
        "exp": 0
    }

# 2. 학습 세션 저장 (StudyModal용)
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
            "date": s.date,
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

    record = StudySession(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        subject=session.subject,
        content=session.content,
        duration_minutes=session.duration_minutes,
        date=session.date,
    )
    db.add(record)
    db.commit()

    _logger.info("[StatDebug] 세션 저장 완료 — stat_gained: %s", stat_gained)
    return {
        "id": record.id,
        "subject": record.subject,
        "stat_gained": stat_gained,
    }