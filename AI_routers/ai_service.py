import logging

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, ValidationError

from AI_routers.ai_config import PROMPTS, settings

logger = logging.getLogger("AI_routers.ai_service")

# 프롬프트는 prompts.yaml에서 관리한다 (AI_routers/ai_config.py 로더 경유).
LLM_JSON_SCHEMA = PROMPTS["llm_json_schema"]
ANALYSIS_INSTRUCTION = PROMPTS["analysis_instruction"]
RETRY_INSTRUCTION = PROMPTS["retry_instruction"]


class StatResponse(BaseModel):
    """API 응답용 스탯 모델 (EXP 포함)."""

    HUM: int = 0  # 인문학 (Humanities)
    SOC: int = 0  # 사회과학 (Social Sciences)
    NAT: int = 0  # 자연과학 (Natural Sciences)
    COL: int = 0  # 협동력 (Collaboration)
    PER: int = 0  # 끈기 (Perseverance)
    ART: int = 0  # 예체능 (Arts & Physical Education)
    EXP: int = 0  # 경험치 (Experience Points)


class LLMStatPayload(BaseModel):
    """LLM 응답 검증용 고정 스키마.

    각 필드는 능력치의 '백분율 분배'(0~100 정수, 합계 100)를 의미한다.
    실제 스탯량은 ai_log에서 학습 시간 기반 총량(budget)을 이 백분율로 나눠 산정한다.
    """

    model_config = ConfigDict(extra="ignore")

    HUM: int
    SOC: int
    NAT: int
    COL: int
    PER: int
    ART: int


class AIService:
    @staticmethod
    async def request_stat_conversion(log_text: str) -> LLMStatPayload:
        """GCP AI 서버(LLM)와 통신하여 자연어 로그를 스탯으로 변환.

        - LLM 응답을 고정 JSON 스키마(LLMStatPayload)로 Pydantic 검증한다.
        - 연동 실패 또는 스키마 위반 시 프롬프트를 보정하여 재요청한다.
        - settings.MAX_RETRIES(최대 2회) 모두 실패하면 콘솔에 에러를 남기고
          HTTPException을 발생시킨다 (프롬프트 점검용).
        """
        payload = {"instruction": ANALYSIS_INSTRUCTION, "text": log_text}
        last_error: Exception | None = None
        last_body = None

        async with httpx.AsyncClient() as client:
            for attempt in range(settings.MAX_RETRIES):
                try:
                    response = await client.post(
                        settings.GCP_AI_ENDPOINT,
                        json=payload,
                        timeout=settings.TIMEOUT,
                    )
                    response.raise_for_status()
                    last_body = response.text
                    # LLM 응답을 고정 스키마로 검증 — 실패 시 ValidationError
                    return LLMStatPayload.model_validate(response.json())
                except httpx.HTTPError as exc:
                    last_error = exc
                    logger.warning(
                        "GCP AI 연동 실패 (%d/%d) [%s]: %s: %s",
                        attempt + 1, settings.MAX_RETRIES, settings.GCP_AI_ENDPOINT,
                        type(exc).__name__, exc,
                    )
                    continue
                except ValidationError as exc:
                    last_error = exc
                    logger.warning(
                        "LLM 응답 스키마 위반 (%d/%d): %s",
                        attempt + 1, settings.MAX_RETRIES, exc,
                    )
                    # 스키마를 다시 명시하여 재요청
                    payload["instruction"] = RETRY_INSTRUCTION
                    continue

        # 두 번 모두 실패 — 콘솔에 상세 에러를 출력해 프롬프트를 수정할 수 있게 한다
        if isinstance(last_error, ValidationError):
            logger.error(
                "LLM 응답이 %d회 모두 JSON 스키마 검증에 실패했습니다. "
                "프롬프트(ANALYSIS_INSTRUCTION)를 점검하세요.\n"
                "  기대 스키마: %s\n"
                "  마지막 응답: %s\n"
                "  검증 오류: %s",
                settings.MAX_RETRIES, LLM_JSON_SCHEMA, last_body, last_error,
            )
            raise HTTPException(status_code=502, detail="GCP AI 응답 스키마 검증 실패")

        logger.error(
            "GCP AI 서버 연동이 %d회 모두 실패했습니다 [%s]: %s: %s",
            settings.MAX_RETRIES, settings.GCP_AI_ENDPOINT,
            type(last_error).__name__, last_error,
        )
        raise HTTPException(status_code=502, detail="GCP AI 서버 연동 실패")
