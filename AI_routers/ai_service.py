import logging
from typing import TypeVar

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

from AI_routers.ai_config import PROMPTS, settings

logger = logging.getLogger("AI_routers.ai_service")

# 프롬프트는 prompts.yaml에서 관리한다 (AI_routers/ai_config.py 로더 경유).
LLM_JSON_SCHEMA = PROMPTS["llm_json_schema"]
ANALYSIS_INSTRUCTION = PROMPTS["analysis_instruction"]
RETRY_INSTRUCTION = PROMPTS["retry_instruction"]
QUIZ_INSTRUCTION = PROMPTS["quiz_instruction"]
QUIZ_RETRY_INSTRUCTION = PROMPTS["quiz_retry_instruction"]

T = TypeVar("T", bound=BaseModel)


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
    """LLM 스탯 응답 검증용 고정 스키마.

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


class QuizItemPayload(BaseModel):
    """LLM 퀴즈 응답의 개별 문항 검증용 스키마."""

    model_config = ConfigDict(extra="ignore")

    question: str
    options: list[str]
    correct_index: int

    @model_validator(mode="after")
    def _check_correct_index(self) -> "QuizItemPayload":
        if len(self.options) < 2:
            raise ValueError("options는 2개 이상이어야 합니다")
        if not 0 <= self.correct_index < len(self.options):
            raise ValueError("correct_index가 options 범위를 벗어났습니다")
        return self


class QuizPayload(BaseModel):
    """LLM 퀴즈 응답 검증용 고정 스키마."""

    model_config = ConfigDict(extra="ignore")

    quizzes: list[QuizItemPayload] = Field(min_length=1)


# 퀴즈는 이 개수를 목표로 누적한다 (prompts.yaml의 "정확히 3개"와 일치).
QUIZ_TARGET_COUNT = 3


def _validate_quiz_items(raw: object) -> tuple[list[QuizItemPayload], int]:
    """퀴즈 응답을 '문항 단위'로 검증한다.

    전체를 한 번에 검증(all-or-nothing)하지 않고 문항별로 검증하여,
    잘못된 문항은 버리고 유효한 문항만 추려낸다.
    반환: (유효 문항 리스트, 무효 문항 수).
    """
    items = raw.get("quizzes", []) if isinstance(raw, dict) else []
    if not isinstance(items, list):
        return [], 0
    valid: list[QuizItemPayload] = []
    invalid = 0
    for item in items:
        try:
            valid.append(QuizItemPayload.model_validate(item))
        except ValidationError:
            invalid += 1
    return valid, invalid


class AIService:
    @staticmethod
    async def _request_llm(
        endpoint: str,
        log_text: str,
        base_instruction: str,
        retry_instruction: str,
        model_cls: type[T],
        label: str,
    ) -> T:
        """GCP AI 서버(LLM)에 요청하고 응답을 고정 스키마로 검증한다.

        - 응답을 model_cls로 Pydantic 검증한다.
        - 연동 실패 또는 스키마 위반 시 프롬프트를 보정하여 재요청한다.
        - settings.MAX_RETRIES(최대 2회) 모두 실패하면 콘솔에 에러를 남기고
          HTTPException을 발생시킨다 (프롬프트 점검용).
        """
        payload = {"instruction": base_instruction, "text": log_text}
        last_error: Exception | None = None
        last_body: str | None = None

        async with httpx.AsyncClient() as client:
            for attempt in range(settings.MAX_RETRIES):
                try:
                    response = await client.post(
                        endpoint, json=payload, timeout=settings.TIMEOUT
                    )
                    response.raise_for_status()
                    last_body = response.text
                    # LLM 응답을 고정 스키마로 검증 — 실패 시 ValidationError
                    return model_cls.model_validate(response.json())
                except (httpx.HTTPError, ValueError) as exc:
                    last_error = exc
                    logger.warning(
                        "%s 연동 실패 (%d/%d) [%s]: %s: %s",
                        label, attempt + 1, settings.MAX_RETRIES, endpoint,
                        type(exc).__name__, exc,
                    )
                    continue
                except ValidationError as exc:
                    last_error = exc
                    logger.warning(
                        "%s 응답 스키마 위반 (%d/%d): %s",
                        label, attempt + 1, settings.MAX_RETRIES, exc,
                    )
                    # 스키마를 다시 명시하여 재요청
                    payload["instruction"] = retry_instruction
                    continue

        # 두 번 모두 실패 — 콘솔에 상세 에러를 출력해 프롬프트를 수정할 수 있게 한다
        if isinstance(last_error, ValidationError):
            logger.error(
                "%s 응답이 %d회 모두 스키마 검증에 실패했습니다. 프롬프트를 점검하세요.\n"
                "  마지막 응답: %s\n  검증 오류: %s",
                label, settings.MAX_RETRIES, last_body, last_error,
            )
            raise HTTPException(status_code=502, detail=f"{label} 응답 스키마 검증 실패")

        logger.error(
            "%s 서버 연동이 %d회 모두 실패했습니다 [%s]: %s: %s",
            label, settings.MAX_RETRIES, endpoint,
            type(last_error).__name__, last_error,
        )
        raise HTTPException(status_code=502, detail=f"{label} 서버 연동 실패")

    @staticmethod
    async def request_stat_conversion(log_text: str) -> LLMStatPayload:
        """자연어 학습 로그 → 6대 능력치 백분율 분배 (GCP LLM)."""
        return await AIService._request_llm(
            settings.GCP_AI_ENDPOINT, log_text,
            ANALYSIS_INSTRUCTION, RETRY_INSTRUCTION,
            LLMStatPayload, "GCP AI",
        )

    @staticmethod
    async def request_quiz_generation(log_text: str) -> QuizPayload:
        """자연어 학습 내용 → 4지선다 복습 퀴즈 생성 (GCP LLM).

        문항 단위로 검증하여 잘못된 문항은 버리고 유효한 문항만 누적한다.
        목표 개수(QUIZ_TARGET_COUNT)에 못 미치면 재요청하여 채우며,
        settings.MAX_RETRIES회 안에 못 채우면 콘솔에 에러를 남기고 실패한다.
        """
        collected: list[QuizItemPayload] = []
        seen_questions: set[str] = set()
        instruction = QUIZ_INSTRUCTION
        last_error: Exception | None = None
        last_body: str | None = None

        async with httpx.AsyncClient() as client:
            for attempt in range(settings.MAX_RETRIES):
                try:
                    response = await client.post(
                        settings.GCP_QUIZ_ENDPOINT,
                        json={"instruction": instruction, "text": log_text},
                        timeout=settings.QUIZ_TIMEOUT,
                    )
                    response.raise_for_status()
                    last_body = response.text
                except httpx.HTTPError as exc:
                    last_error = exc
                    logger.warning(
                        "GCP 퀴즈 연동 실패 (%d/%d) [%s]: %s: %s",
                        attempt + 1, settings.MAX_RETRIES, settings.GCP_QUIZ_ENDPOINT,
                        type(exc).__name__, exc,
                    )
                    continue

                # 문항 단위 검증 — 유효 문항만 누적 (질문 중복 제거)
                valid, invalid = _validate_quiz_items(response.json())
                for item in valid:
                    key = item.question.strip()
                    if key and key not in seen_questions:
                        seen_questions.add(key)
                        collected.append(item)

                if len(collected) >= QUIZ_TARGET_COUNT:
                    return QuizPayload(quizzes=collected[:QUIZ_TARGET_COUNT])

                # 부족 — 잘못된 문항은 버리고 부족분을 재요청
                last_error = ValueError(
                    f"유효 문항 누적 {len(collected)}/{QUIZ_TARGET_COUNT}개"
                )
                logger.warning(
                    "GCP 퀴즈 문항 부족 (%d/%d): 누적 유효 %d / 목표 %d (이번 응답 무효 %d개) — 재요청",
                    attempt + 1, settings.MAX_RETRIES,
                    len(collected), QUIZ_TARGET_COUNT, invalid,
                )
                instruction = QUIZ_RETRY_INSTRUCTION

        # 목표 개수를 못 채움 — 콘솔에 상세 에러 출력
        logger.error(
            "GCP 퀴즈 생성이 %d회 만에 목표(%d개)를 못 채웠습니다 [%s]: "
            "누적 %d개, 마지막 오류 %s: %s\n  마지막 응답: %s",
            settings.MAX_RETRIES, QUIZ_TARGET_COUNT, settings.GCP_QUIZ_ENDPOINT,
            len(collected), type(last_error).__name__, last_error, last_body,
        )
        raise HTTPException(status_code=502, detail="GCP 퀴즈 생성 실패")
