import math
from typing import Literal

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from AI_routers.ai_config import settings
from AI_routers.ai_service import (
    AIService,
    QUIZ_DEPTH_ORDER,
    LearningDepth,
    QuizPayload,
    StatResponse,
)

router = APIRouter(prefix="/ai", tags=["AI 학습 패턴 및 스탯 변환"])

# 6대 능력치 키 (EXP 제외)
STAT_KEYS = ("HUM", "SOC", "NAT", "COL", "PER", "ART")


def _depth_weight(depth: LearningDepth) -> float:
    """학습 깊이(암기/이해/응용)에 대응하는 EXP 가중치."""
    if depth == "memorize":
        return settings.EXP_DEPTH_WEIGHT_MEMORIZE
    if depth == "apply":
        return settings.EXP_DEPTH_WEIGHT_APPLY
    return settings.EXP_DEPTH_WEIGHT_UNDERSTAND


def _quiz_below_stat_threshold(results: list[bool]) -> bool:
    """퀴즈 정답 수가 보상 임계치 미만인지 판정한다.

    True를 반환하면 호출자는 LLM 분석을 건너뛰고 빈 스탯을 그대로 반환해야 한다.
    임계치는 settings.QUIZ_MIN_CORRECT_FOR_STATS (기본 1).
    """
    return sum(1 for r in results if r) < settings.QUIZ_MIN_CORRECT_FOR_STATS


def _depth_from_quiz_results(results: list[bool]) -> LearningDepth:
    """퀴즈 정답 여부로 학습 깊이를 판정한다.

    퀴즈는 1번 암기 → 2번 이해 → 3번 응용 순서로 출제된다.
    '가장 높은 단계까지 정답을 맞춘' 깊이를 채택한다.
        - 3번(응용) 정답  → "apply"
        - 2번(이해) 정답  → "understand"
        - 그 외           → "memorize" (1번만 맞히거나 모두 틀린 경우)
    """
    if len(results) >= 3 and results[2]:
        return "apply"
    if len(results) >= 2 and results[1]:
        return "understand"
    return "memorize"


class LogRequest(BaseModel):
    log_text: str
    duration_minutes: int  # 학습 시간 — 총 스탯량 산정에 사용
    # 퀴즈 결과 (정답 여부, 출제 순서대로: 암기/이해/응용).
    # 주어지면 LLM의 자가분류 대신 이 결과로 학습 깊이를 결정한다.
    quiz_results: list[bool] | None = None


def _calculate_stat_budget(duration_minutes: int) -> float:
    """학습 시간(분)에 따라 부여할 '총 스탯량'을 계산한다.

    로그 곡선: 초반에는 적절히 오르다가, 시간이 매우 길어질수록
    settings.MAX_STAT_BUDGET(≈10)에 점근한다.
        budget = MAX * g / (g + OFFSET),  g = ln(1 + minutes / SCALE)
    """
    minutes = max(0, duration_minutes)
    growth = math.log1p(minutes / settings.STAT_BUDGET_SCALE)
    return settings.MAX_STAT_BUDGET * growth / (growth + settings.STAT_BUDGET_OFFSET)


def _distribute_budget(percentages: dict[str, int], budget: float) -> dict[str, int]:
    """AI가 정한 백분율로 총 스탯량을 6대 능력치에 분배한다.

    AI 응답의 합이 정확히 100이 아니어도 실제 합으로 정규화하여 안전하게 분배한다.
    """
    total_pct = sum(percentages.values())
    if total_pct <= 0:
        return {key: 0 for key in STAT_KEYS}
    return {
        key: round(budget * percentages[key] / total_pct)
        for key in STAT_KEYS
    }


def _calculate_exp(stats: dict[str, int], depth: LearningDepth) -> int:
    """분배된 능력치 합계 × 학습 깊이 가중치로 경험치(EXP)를 계산한다.

    같은 시간을 공부해도 단순 암기보다 응용 학습이 더 큰 EXP를 받는다.
    """
    base = sum(stats.values()) * settings.EXP_PER_STAT_POINT
    return round(base * _depth_weight(depth))


async def analyze_log_to_stats(
    log_text: str,
    duration_minutes: int,
    quiz_results: list[bool] | None = None,
) -> StatResponse:
    """자연어 로그를 LLM으로 분석하여 스탯/EXP로 변환하는 핵심 로직.

    0. (게이트) 퀴즈 결과가 주어졌고 정답 수가 임계치 미만이면 LLM 호출 없이
       빈 StatResponse(모두 0)를 즉시 반환한다. 학습으로 인정하지 않는다.
    1. AIService가 GCP LLM 호출 — LLM은 6대 능력치 '백분율 분배'와
       학습 깊이(암기/이해/응용)를 함께 반환한다.
    2. 학습 시간(분)으로부터 로그 곡선 기반 '총 스탯량'을 계산한다.
    3. 백분율에 따라 총 스탯량을 각 능력치에 분배한다.
    4. 학습 깊이를 결정한다:
       - 퀴즈 결과가 주어지면 가장 높이 맞춘 단계로 판정한다.
       - 없으면 LLM의 자가분류(payload.depth)를 사용한다.
    5. 분배된 능력치 합계 × 깊이 가중치로 EXP를 계산한다.
    """
    if quiz_results is not None and _quiz_below_stat_threshold(quiz_results):
        return StatResponse()
    payload = await AIService.request_stat_conversion(log_text)
    percentages = {key: max(0, getattr(payload, key)) for key in STAT_KEYS}
    budget = _calculate_stat_budget(duration_minutes)
    stats = _distribute_budget(percentages, budget)
    depth: LearningDepth = (
        _depth_from_quiz_results(quiz_results)
        if quiz_results is not None
        else payload.depth
    )
    exp = _calculate_exp(stats, depth)
    return StatResponse(**stats, EXP=exp)


@router.post("/convert", response_model=StatResponse)
async def convert_log_to_stat(request: LogRequest):
    """자연어 학습 로그를 스탯/EXP로 변환한다.

    quiz_results가 함께 전달되면 퀴즈 풀이 결과로 학습 깊이를 판정해
    EXP 가중치에 반영한다.
    """
    return await analyze_log_to_stats(
        request.log_text, request.duration_minutes, request.quiz_results,
    )


class QuizRequest(BaseModel):
    content: str  # 사용자가 입력한 학습 내용


@router.post("/quiz", response_model=QuizPayload)
async def generate_quiz(request: QuizRequest):
    """사용자의 학습 내용을 바탕으로 4지선다 복습 퀴즈를 AI로 생성한다."""
    return await AIService.request_quiz_generation(request.content)


class StatDebugResponse(BaseModel):
    """[개발자용] 변환 파이프라인의 모든 중간 단계를 노출하는 디버그 응답."""

    log_text: str
    duration_minutes: int
    short_circuited: bool              # 퀴즈 게이트로 LLM 호출을 건너뛰었는지
    quiz_correct_count: int | None     # 퀴즈 정답 수 (게이트 판정 근거)
    quiz_threshold: int                # 보상에 필요한 최소 정답 수 (settings)
    gcp_percentages: dict[str, int]    # GCP LLM이 반환한 백분율 (0 이상으로 정규화 후)
    percentage_sum: int                # 백분율 합계 (100에 가까워야 정상)
    stat_budget: float                 # 학습 시간 기반 총 스탯량 (로그 곡선)
    distributed_stats: dict[str, int]  # 백분율로 분배된 최종 능력치
    llm_depth: LearningDepth           # LLM이 자가분류한 학습 깊이 (fallback용)
    quiz_results: list[bool] | None    # 입력으로 받은 퀴즈 결과 (있으면 깊이의 근거)
    depth: LearningDepth               # 최종 채택된 학습 깊이 (퀴즈 우선, 없으면 LLM)
    depth_source: Literal["quiz", "llm"]  # 깊이의 출처
    depth_weight: float                # 깊이에 대응하는 EXP 가중치
    exp: int                           # 깊이 가중치까지 반영된 최종 EXP
    result: StatResponse               # 최종 응답 (analyze_log_to_stats와 동일)


@router.post("/debug/convert", response_model=StatDebugResponse)
async def debug_convert_log_to_stat(request: LogRequest):
    """[개발자용] 로그→스탯 변환의 모든 중간 단계를 단계별로 반환한다.

    settings.DEBUG가 켜져 있을 때만 동작한다 (.env에 DEBUG=true).
    프롬프트 튜닝 시 GCP 백분율 응답·budget·분배 결과를 한눈에 확인하는 용도.
    """
    if not settings.DEBUG:
        raise HTTPException(
            status_code=404,
            detail="디버그 엔드포인트가 비활성화되어 있습니다 (.env에 DEBUG=true 설정 필요)",
        )

    quiz_correct = (
        sum(1 for r in request.quiz_results if r)
        if request.quiz_results is not None else None
    )

    # 퀴즈 게이트 — 정답 수가 임계치 미만이면 LLM 호출 없이 0 응답
    if request.quiz_results is not None and _quiz_below_stat_threshold(request.quiz_results):
        zero_stats = {key: 0 for key in STAT_KEYS}
        return StatDebugResponse(
            log_text=request.log_text,
            duration_minutes=request.duration_minutes,
            short_circuited=True,
            quiz_correct_count=quiz_correct,
            quiz_threshold=settings.QUIZ_MIN_CORRECT_FOR_STATS,
            gcp_percentages=zero_stats,
            percentage_sum=0,
            stat_budget=0.0,
            distributed_stats=zero_stats,
            llm_depth="memorize",
            quiz_results=request.quiz_results,
            depth=_depth_from_quiz_results(request.quiz_results),
            depth_source="quiz",
            depth_weight=0.0,
            exp=0,
            result=StatResponse(),
        )

    payload = await AIService.request_stat_conversion(request.log_text)
    percentages = {key: max(0, getattr(payload, key)) for key in STAT_KEYS}
    budget = _calculate_stat_budget(request.duration_minutes)
    stats = _distribute_budget(percentages, budget)

    if request.quiz_results is not None:
        depth: LearningDepth = _depth_from_quiz_results(request.quiz_results)
        depth_source: Literal["quiz", "llm"] = "quiz"
    else:
        depth = payload.depth
        depth_source = "llm"
    exp = _calculate_exp(stats, depth)

    return StatDebugResponse(
        log_text=request.log_text,
        duration_minutes=request.duration_minutes,
        short_circuited=False,
        quiz_correct_count=quiz_correct,
        quiz_threshold=settings.QUIZ_MIN_CORRECT_FOR_STATS,
        gcp_percentages=percentages,
        percentage_sum=sum(percentages.values()),
        stat_budget=round(budget, 4),
        distributed_stats=stats,
        llm_depth=payload.depth,
        quiz_results=request.quiz_results,
        depth=depth,
        depth_source=depth_source,
        depth_weight=_depth_weight(depth),
        exp=exp,
        result=StatResponse(**stats, EXP=exp),
    )


# [개발자용] /ai/debug 에서 띄우는 입력 폼 페이지.
# JSON을 직접 짜지 않고 텍스트박스에 입력만 하면 /ai/debug/convert를 호출한다.
_DEBUG_PAGE_HTML = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>StatLog AI 디버그</title>
<style>
  body { font-family: system-ui, sans-serif; background:#0F0F1A; color:#eee;
         max-width:720px; margin:40px auto; padding:0 20px; }
  h1 { font-size:18px; color:#C9A84C; }
  label { display:block; margin:16px 0 6px; font-size:13px; color:#aaa; }
  textarea, input { width:100%; box-sizing:border-box; background:#1A1A2E;
         border:1px solid #333; border-radius:8px; color:#fff; padding:10px;
         font-size:14px; font-family:inherit; }
  textarea { height:90px; resize:vertical; }
  button { margin-top:16px; background:#C9A84C; color:#0F0F1A; border:none;
         border-radius:8px; padding:11px 20px; font-size:14px; font-weight:700;
         cursor:pointer; }
  button:disabled { opacity:.5; cursor:default; }
  pre { background:#1A1A2E; border:1px solid #333; border-radius:8px;
        padding:14px; margin-top:20px; white-space:pre-wrap; word-break:break-all;
        font-size:13px; line-height:1.5; }
  .err { color:#EF4444; }
</style>
</head>
<body>
  <h1>🛠 StatLog AI 변환 디버그</h1>
  <label for="log">학습 내용 (log_text)</label>
  <textarea id="log" placeholder="예: 영어 문법 관계대명사와 가정법을 공부하고 예문 30개를 작성했다"></textarea>
  <label for="dur">소요 시간 (분)</label>
  <input id="dur" type="number" min="0" value="60">
  <button id="run" onclick="run()">변환 실행</button>
  <pre id="out">결과가 여기에 표시됩니다.</pre>
<script>
async function run() {
  const btn = document.getElementById('run');
  const out = document.getElementById('out');
  const log_text = document.getElementById('log').value;
  const duration_minutes = parseInt(document.getElementById('dur').value, 10) || 0;
  btn.disabled = true; out.className = ''; out.textContent = '요청 중... (LLM 추론에 수십 초 걸릴 수 있습니다)';
  try {
    const res = await fetch(window.location.pathname + '/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log_text, duration_minutes }),
    });
    const data = await res.json();
    out.className = res.ok ? '' : 'err';
    out.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    out.className = 'err'; out.textContent = '요청 실패: ' + e;
  } finally {
    btn.disabled = false;
  }
}
</script>
</body>
</html>"""


@router.get("/debug", response_class=HTMLResponse)
async def debug_page():
    """[개발자용] /ai/debug/convert를 텍스트박스 폼으로 호출하는 디버그 페이지.

    settings.DEBUG가 켜져 있을 때만 동작한다. 브라우저로 /api/v1/ai/debug 접속.
    """
    if not settings.DEBUG:
        raise HTTPException(
            status_code=404,
            detail="디버그 엔드포인트가 비활성화되어 있습니다 (.env에 DEBUG=true 설정 필요)",
        )
    return HTMLResponse(_DEBUG_PAGE_HTML)
