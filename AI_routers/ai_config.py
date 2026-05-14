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
    return {
        "llm_json_schema": schema,
        "analysis_instruction": raw["analysis_instruction"].format(schema=schema).strip(),
        "retry_instruction": raw["retry_instruction"].format(schema=schema).strip(),
    }


# 프롬프트는 prompts.yaml 한 곳에서 관리한다.
PROMPTS = _load_prompts()


class Settings:
    GCP_AI_ENDPOINT: str = os.getenv("GCP_AI_ENDPOINT", "http://<GCP-IP>:8000/generate_stats")
    MAX_RETRIES: int = 2  # GCP 연동/스키마 검증 실패 시 재요청 횟수 (최대 2회)
    TIMEOUT: float = 30.0
    # 스탯 1포인트당 부여할 경험치 (EXP 계산에 사용)
    EXP_PER_STAT_POINT: int = int(os.getenv("EXP_PER_STAT_POINT", "10"))
    # 학습 시간(분) → 총 스탯량 로그 곡선 파라미터
    # budget = MAX * g / (g + OFFSET),  g = ln(1 + minutes / SCALE)
    MAX_STAT_BUDGET: float = float(os.getenv("MAX_STAT_BUDGET", "10"))      # 시간이 매우 길어질 때 근접하는 상한
    STAT_BUDGET_SCALE: float = float(os.getenv("STAT_BUDGET_SCALE", "30"))  # 로그 곡선 스케일 (분)
    STAT_BUDGET_OFFSET: float = float(os.getenv("STAT_BUDGET_OFFSET", "0.8"))  # 상한 근접 속도 조절
    # 개발자용 디버그 엔드포인트 활성화 여부 (.env에 DEBUG=true)
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("1", "true", "yes")

settings = Settings()
