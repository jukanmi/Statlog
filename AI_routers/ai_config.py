import os
from pathlib import Path

import yaml
from dotenv import load_dotenv

load_dotenv()

_PROMPTS_PATH = Path(__file__).parent / "prompts.yaml"


def _load_prompts() -> dict:
    """prompts.yaml을 읽어 {schema} 치환까지 끝낸 프롬프트 딕셔너리를 반환."""
    with open(_PROMPTS_PATH, encoding="utf-8") as f:
        raw = yaml.safe_load(f)
    schema = raw["llm_json_schema"].strip()
    quiz_schema = raw["quiz_json_schema"].strip()
    portfolio_schema = raw["portfolio_json_schema"].strip()
    return {
        "llm_json_schema": schema,
        "analysis_instruction": raw["analysis_instruction"].format(schema=schema).strip(),
        "retry_instruction": raw["retry_instruction"].format(schema=schema).strip(),
        "quiz_json_schema": quiz_schema,
        "quiz_instruction": raw["quiz_instruction"].format(schema=quiz_schema).strip(),
        "quiz_retry_instruction": raw["quiz_retry_instruction"].format(schema=quiz_schema).strip(),
        # 부분 재요청 프롬프트는 런타임에 누락 분류 라벨로 <<MISSING>> 치환을 또 거친다.
        # yaml에서 <<MISSING>>으로 작성된 부분이 .replace()를 통해 치환된다.
        "quiz_partial_retry_instruction": raw["quiz_partial_retry_instruction"]
            .format(schema=quiz_schema)
            .strip(),
        "portfolio_json_schema": portfolio_schema,
        "portfolio_instruction": raw["portfolio_instruction"].format(schema=portfolio_schema).strip(),
        "portfolio_retry_instruction": raw["portfolio_retry_instruction"].format(schema=portfolio_schema).strip(),
    }


# 프롬프트는 prompts.yaml 한 곳에서 관리한다.
PROMPTS = _load_prompts()


class Settings:
    GCP_AI_ENDPOINT: str = os.getenv("GCP_AI_ENDPOINT", "http://<GCP-IP>:8000/generate_stats")
    # 퀴즈 생성 엔드포인트 — 기본값은 GCP_AI_ENDPOINT와 같은 호스트의 /generate_quiz
    GCP_QUIZ_ENDPOINT: str = os.getenv(
        "GCP_QUIZ_ENDPOINT",
        GCP_AI_ENDPOINT.rsplit("/", 1)[0] + "/generate_quiz",
    )
    MAX_RETRIES: int = 1  # GCP 연동/스키마 검증 실패 시 재요청 횟수
    TIMEOUT: float = float(os.getenv("STAT_TIMEOUT", "45"))  # 스탯 변환 요청 타임아웃(초)
    # 퀴즈 생성은 문항 3개를 만들어 스탯 변환보다 오래 걸린다 — 별도 타임아웃
    QUIZ_TIMEOUT: float = float(os.getenv("QUIZ_TIMEOUT", "90"))
    # 포트폴리오 생성 엔드포인트 — 기본값은 GCP_AI_ENDPOINT와 같은 호스트의 /generate_portfolio
    GCP_PORTFOLIO_ENDPOINT: str = os.getenv(
        "GCP_PORTFOLIO_ENDPOINT",
        GCP_AI_ENDPOINT.rsplit("/", 1)[0] + "/generate_portfolio",
    )
    # 포트폴리오는 여러 섹션의 문단형 텍스트를 생성해 오래 걸린다 — 별도 타임아웃
    PORTFOLIO_TIMEOUT: float = float(os.getenv("PORTFOLIO_TIMEOUT", "90"))
    # 스탯 1포인트당 부여할 경험치 (EXP 계산에 사용)
    EXP_PER_STAT_POINT: int = int(os.getenv("EXP_PER_STAT_POINT", "10"))
    # 학습 깊이(암기/이해/응용)에 따른 EXP 가중치
    EXP_DEPTH_WEIGHT_MEMORIZE: float = float(os.getenv("EXP_DEPTH_WEIGHT_MEMORIZE", "1.0"))
    EXP_DEPTH_WEIGHT_UNDERSTAND: float = float(os.getenv("EXP_DEPTH_WEIGHT_UNDERSTAND", "1.3"))
    EXP_DEPTH_WEIGHT_APPLY: float = float(os.getenv("EXP_DEPTH_WEIGHT_APPLY", "1.6"))
    # 퀴즈 정답 수가 이 값 미만이면 LLM 분석을 건너뛰고 스탯·EXP를 모두 0으로 반환한다.
    # 기본 1 — 3문제를 모두 틀리면 학습으로 인정하지 않는다.
    QUIZ_MIN_CORRECT_FOR_STATS: int = int(os.getenv("QUIZ_MIN_CORRECT_FOR_STATS", "1"))
    # 학습 시간(분) → 총 스탯량 로그 곡선 파라미터
    # budget = MAX * g / (g + OFFSET),  g = ln(1 + minutes / SCALE)
    MAX_STAT_BUDGET: float = float(os.getenv("MAX_STAT_BUDGET", "10"))      # 시간이 매우 길어질 때 근접하는 상한
    STAT_BUDGET_SCALE: float = float(os.getenv("STAT_BUDGET_SCALE", "30"))  # 로그 곡선 스케일 (분)
    STAT_BUDGET_OFFSET: float = float(os.getenv("STAT_BUDGET_OFFSET", "0.8"))  # 상한 근접 속도 조절
    # 개발자용 디버그 엔드포인트 활성화 여부 (.env에 DEBUG=true)
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("1", "true", "yes")

settings = Settings()
