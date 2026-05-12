import httpx
from fastapi import HTTPException
from AI_routers.ai_config import settings

class AIService:
    @staticmethod
    async def request_stat_conversion(log_text: str) -> dict:
        """GCP AI 서버와 통신하여 텍스트를 스탯으로 변환"""
        async with httpx.AsyncClient() as client:
            for attempt in range(settings.MAX_RETRIES):
                try:
                    response = await client.post(
                        settings.GCP_AI_ENDPOINT,
                        json={"text": log_text},
                        timeout=settings.TIMEOUT
                    )
                    response.raise_for_status()
                    return response.json()
                except httpx.HTTPError:
                    if attempt == settings.MAX_RETRIES - 1:
                        raise HTTPException(status_code=502, detail="GCP AI 서버 연동 실패")
                    continue
