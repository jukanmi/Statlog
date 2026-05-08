from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict

app = FastAPI()

# --- 데이터 모델 (프론트 명세서 기반) ---

class Stats(BaseModel):
    INT: int = 0
    STR: int = 0
    END: int = 0
    AGI: int = 0
    CHA: int = 0

class User(BaseModel):
    id: str
    nickname: str
    profile_image: Optional[str] = None
    stats: Stats
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
    # 여기서 나중에 GCP AI 서버로 content를 보내서 스탯을 계산할 거예요!
    # 지금은 성공했다는 메시지만 보냅니다.
    print(f"받은 공부 내용: {session.content}")
    
    return {
        "id": "session-123",
        "subject": session.subject,
        "stat_gained": {"INT": 5, "END": 2} # 가짜 보상 데이터
    }