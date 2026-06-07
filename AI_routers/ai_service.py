import logging
from typing import Literal, TypeVar

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
QUIZ_PARTIAL_RETRY_INSTRUCTION = PROMPTS["quiz_partial_retry_instruction"]
PORTFOLIO_INSTRUCTION = PROMPTS["portfolio_instruction"]
PORTFOLIO_RETRY_INSTRUCTION = PROMPTS["portfolio_retry_instruction"]

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


# 학습 깊이 — LLM이 분류하는 세 단계 (암기/이해/응용)
LearningDepth = Literal["memorize", "understand", "apply"]


class LLMStatPayload(BaseModel):
    """LLM 스탯 응답 검증용 고정 스키마.

    HUM~ART 필드는 능력치의 '백분율 분배'(0~100 정수, 합계 100)를 의미한다.
    depth는 학습 '깊이'를 한 단어로 분류한 값으로, EXP 가중치 계산에 쓰인다.
    실제 스탯량은 ai_log에서 학습 시간 기반 총량(budget)을 이 백분율로 나눠 산정한다.
    """

    model_config = ConfigDict(extra="ignore")

    HUM: int
    SOC: int
    NAT: int
    COL: int
    PER: int
    ART: int
    depth: LearningDepth = "understand"


class QuizItemPayload(BaseModel):
    """LLM 퀴즈 응답의 개별 문항 검증용 스키마.

    depth는 문항의 학습 깊이 분류로, 부분 재요청 시 누락 분류를 식별하는 키.
    LLM이 깊이를 빠뜨려도 응답 순서로 보정한다 (router 측에서 처리).
    """

    model_config = ConfigDict(extra="ignore")

    question: str
    options: list[str]
    correct_index: int
    # 정답이 '왜 정답인지'만 설명하는 해설. LLM이 빠뜨려도 검증은 통과시킨다.
    explanation: str | None = None
    depth: LearningDepth | None = None

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


class SubjectAnalysis(BaseModel):
    """포트폴리오의 과목별 분석 한 줄."""

    model_config = ConfigDict(extra="ignore")

    subject: str
    comment: str


class PortfolioPayload(BaseModel):
    """LLM 포트폴리오 응답 검증용 고정 스키마."""

    model_config = ConfigDict(extra="ignore")

    summary: str
    strengths: list[str] = Field(default_factory=list)
    subject_analysis: list[SubjectAnalysis] = Field(default_factory=list)
    recommended_paths: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)


# 퀴즈는 이 3가지 깊이를 이 순서로 출제·수집한다.
# prompts.yaml의 "1번 암기 → 2번 이해 → 3번 응용"과 일치해야 한다.
QUIZ_DEPTH_ORDER: tuple[LearningDepth, ...] = ("memorize", "understand", "apply")
QUIZ_TARGET_COUNT = len(QUIZ_DEPTH_ORDER)

# 부분 재요청 시 LLM에 보여줄 한국어 분류 라벨.
_DEPTH_KO: dict[LearningDepth, str] = {
    "memorize": "암기",
    "understand": "이해",
    "apply": "응용",
}


def _format_missing_labels(missing: tuple[LearningDepth, ...]) -> str:
    """누락 분류 튜플 → "1번 이해, 2번 응용" 같은 한국어 라벨 문자열."""
    return ", ".join(
        f"{i + 1}번 {_DEPTH_KO[d]}({d})" for i, d in enumerate(missing)
    )


def _route_quiz_items(
    raw: object,
    expected: tuple[LearningDepth, ...],
) -> tuple[dict[LearningDepth, QuizItemPayload], int]:
    """LLM 응답을 깊이별 슬롯에 배치한다.

    - 각 문항의 'depth' 필드를 우선 사용해 슬롯에 매핑한다.
    - depth가 비어 있거나 인식 불가하면 응답 순서를 expected에 매칭한다
      (예: expected=("understand","apply")일 때 첫 번째 무라벨 문항은 understand로).
    - 같은 깊이가 여러 번 오면 첫 유효 문항만 채택한다.
    반환: (깊이→문항 매핑, 무효 문항 수).
    """
    items = raw.get("quizzes", []) if isinstance(raw, dict) else []
    if not isinstance(items, list):
        return {}, 0

    slots: dict[LearningDepth, QuizItemPayload] = {}
    invalid = 0
    fallback_pos = 0
    for item in items:
        try:
            validated = QuizItemPayload.model_validate(item)
        except ValidationError:
            invalid += 1
            fallback_pos += 1
            continue

        depth = validated.depth
        if depth not in QUIZ_DEPTH_ORDER:
            depth = (
                expected[fallback_pos]
                if fallback_pos < len(expected)
                else None
            )
        fallback_pos += 1

        if depth and depth not in slots:
            validated.depth = depth  # 빈 라벨 보정
            slots[depth] = validated
    return slots, invalid


class AIService:
    @staticmethod
    async def _request_llm(
        endpoint: str,
        log_text: str,
        base_instruction: str,
        retry_instruction: str,
        model_cls: type[T],
        label: str,
        timeout: float | None = None,
    ) -> T:
        """GCP AI 서버(LLM)에 요청하고 응답을 고정 스키마로 검증한다.

        - 응답을 model_cls로 Pydantic 검증한다.
        - 연동 실패 또는 스키마 위반 시 프롬프트를 보정하여 재요청한다.
        - settings.MAX_RETRIES(최대 2회) 모두 실패하면 콘솔에 에러를 남기고
          HTTPException을 발생시킨다 (프롬프트 점검용).
        - timeout 미지정 시 settings.TIMEOUT(스탯 변환 기준)을 사용한다.
        """
        payload = {"instruction": base_instruction, "text": log_text}
        last_error: Exception | None = None
        last_body: str | None = None
        request_timeout = timeout if timeout is not None else settings.TIMEOUT

        async with httpx.AsyncClient() as client:
            for attempt in range(settings.MAX_RETRIES):
                try:
                    response = await client.post(
                        endpoint, json=payload, timeout=request_timeout
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
    async def request_portfolio_generation(log_text: str) -> PortfolioPayload:
        """학습 스탯·기록 요약 → 취업용 포트폴리오 생성 (GCP LLM)."""
        return await AIService._request_llm(
            settings.GCP_PORTFOLIO_ENDPOINT, log_text,
            PORTFOLIO_INSTRUCTION, PORTFOLIO_RETRY_INSTRUCTION,
            PortfolioPayload, "GCP 포트폴리오",
            timeout=settings.PORTFOLIO_TIMEOUT,
        )

    @staticmethod
    async def request_quiz_generation(log_text: str) -> QuizPayload:
        """자연어 학습 내용 → 4지선다 복습 퀴즈 생성 (GCP LLM).

        깊이별 슬롯(암기/이해/응용)을 추적하여, 누락되거나 스키마를 위반한
        '그 분류의 문항만' 다시 요청한다. 단순히 부족 개수를 채우지 않는다.
        settings.MAX_RETRIES회 안에 3슬롯을 모두 채우지 못하면 502.
        """
        slots: dict[LearningDepth, QuizItemPayload] = {}
        missing: tuple[LearningDepth, ...] = QUIZ_DEPTH_ORDER
        last_error: Exception | None = None
        last_body: str | None = None

        async with httpx.AsyncClient() as client:
            for attempt in range(settings.MAX_RETRIES):
                # 첫 시도는 전체 출제, 이후엔 누락 분류만 부분 재요청
                if attempt == 0 or len(missing) == len(QUIZ_DEPTH_ORDER):
                    instruction = (
                        QUIZ_INSTRUCTION if attempt == 0 else QUIZ_RETRY_INSTRUCTION
                    )
                else:
                    # 스키마 안의 중괄호와 충돌하지 않도록 replace로 치환
                    instruction = QUIZ_PARTIAL_RETRY_INSTRUCTION.replace(
                        "<<MISSING>>", _format_missing_labels(missing),
                    )

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

                # 응답을 누락 분류 슬롯에 배치 — depth 라벨 우선, 없으면 missing 순서로 보정
                new_slots, invalid = _route_quiz_items(response.json(), missing)
                for depth, item in new_slots.items():
                    if depth not in slots:
                        slots[depth] = item

                missing = tuple(d for d in QUIZ_DEPTH_ORDER if d not in slots)
                if not missing:
                    return QuizPayload(quizzes=[slots[d] for d in QUIZ_DEPTH_ORDER])

                last_error = ValueError(
                    f"누락 분류 {[_DEPTH_KO[d] for d in missing]}"
                )
                logger.warning(
                    "GCP 퀴즈 분류 누락 (%d/%d): 채워진 %s / 누락 %s (이번 응답 무효 %d개) — 누락 분류만 재요청",
                    attempt + 1, settings.MAX_RETRIES,
                    [_DEPTH_KO[d] for d in slots],
                    [_DEPTH_KO[d] for d in missing],
                    invalid,
                )

        # 누락 분류를 끝까지 못 채움 — 콘솔에 상세 에러 출력
        logger.error(
            "GCP 퀴즈 생성이 %d회 만에 분류를 모두 채우지 못했습니다 [%s]: "
            "채워진 %s, 누락 %s, 마지막 오류 %s: %s\n  마지막 응답: %s",
            settings.MAX_RETRIES, settings.GCP_QUIZ_ENDPOINT,
            [_DEPTH_KO[d] for d in slots],
            [_DEPTH_KO[d] for d in missing],
            type(last_error).__name__, last_error, last_body,
        )
        raise HTTPException(status_code=502, detail="GCP 퀴즈 생성 실패")
