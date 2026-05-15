from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from AI_routers.ai_service import AIService
from AI_routers.ai_log import StatResponse
from fastapi.middleware.cors import CORSMiddleware
from api import auth, users, analytics
from services.oauth import close_http_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    yield
    # shutdown
    await close_http_client()


app = FastAPI(title="Study Quest API", lifespan=lifespan)

# 프론트엔드 로컬 개발 주소 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")


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
        "stats": {"INT": 50, "STR": 10, "END": 20, "AGI": 5, "CHA": 10},
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

@app.post("/api/v1/study/sessions", status_code=201)
async def save_study_session(session: StudySessionRequest):
    stat_gained = await AIService.request_stat_conversion(session.content)
    return {
        "id": "session-123",
        "subject": session.subject,
        "stat_gained": stat_gained
    }