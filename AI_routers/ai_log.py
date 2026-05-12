from fastapi import APIRouter
from pydantic import BaseModel
from AI_routers.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI 학습 패턴 및 스탯 변환"])

class LogRequest(BaseModel):
    log_text: str

class StatResponse(BaseModel):
    HUM: int = 0  # 인문학 (Humanities)
    SOC: int = 0  # 사회과학 (Social Sciences)
    NAT: int = 0  # 자연과학 (Natural Sciences)
    COL: int = 0  # 협동력 (Collaboration)
    PER: int = 0  # 끈기 (Perseverance)
    ART: int = 0  # 예체능 (Arts & Physical Education)
    EXP: int = 0  # 경험치 (Experience Points)

@router.post("/convert", response_model=StatResponse)
async def convert_log_to_stat(request: LogRequest):
    result = await AIService.request_stat_conversion(request.log_text)
    return result
