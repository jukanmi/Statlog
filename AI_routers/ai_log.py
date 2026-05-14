import math

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from AI_routers.ai_config import settings
from AI_routers.ai_service import AIService, StatResponse

router = APIRouter(prefix="/ai", tags=["AI 학습 패턴 및 스탯 변환"])

# 6대 능력치 키 (EXP 제외)
STAT_KEYS = ("HUM", "SOC", "NAT", "COL", "PER", "ART")


class LogRequest(BaseModel):
    log_text: str
    duration_minutes: int  # 학습 시간 — 총 스탯량 산정에 사용


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


def _calculate_exp(stats: dict[str, int]) -> int:
    """분배된 능력치 합계에 비례하여 경험치(EXP)를 계산한다."""
    return sum(stats.values()) * settings.EXP_PER_STAT_POINT


async def analyze_log_to_stats(log_text: str, duration_minutes: int) -> StatResponse:
    """자연어 로그를 LLM으로 분석하여 스탯/EXP로 변환하는 핵심 로직.

    1. AIService가 GCP LLM 호출 — LLM은 6대 능력치 '백분율 분배'를 반환한다.
    2. 학습 시간(분)으로부터 로그 곡선 기반 '총 스탯량'을 계산한다.
    3. 백분율에 따라 총 스탯량을 각 능력치에 분배한다.
    4. 분배된 능력치 합계로부터 EXP를 계산한다.
    """
    payload = await AIService.request_stat_conversion(log_text)
    percentages = {key: max(0, getattr(payload, key)) for key in STAT_KEYS}
    budget = _calculate_stat_budget(duration_minutes)
    stats = _distribute_budget(percentages, budget)
    exp = _calculate_exp(stats)
    return StatResponse(**stats, EXP=exp)


@router.post("/convert", response_model=StatResponse)
async def convert_log_to_stat(request: LogRequest):
    """자연어 학습 로그를 스탯/EXP로 변환한다."""
    return await analyze_log_to_stats(request.log_text, request.duration_minutes)


class StatDebugResponse(BaseModel):
    """[개발자용] 변환 파이프라인의 모든 중간 단계를 노출하는 디버그 응답."""

    log_text: str
    duration_minutes: int
    gcp_percentages: dict[str, int]    # GCP LLM이 반환한 백분율 (0 이상으로 정규화 후)
    percentage_sum: int                # 백분율 합계 (100에 가까워야 정상)
    stat_budget: float                 # 학습 시간 기반 총 스탯량 (로그 곡선)
    distributed_stats: dict[str, int]  # 백분율로 분배된 최종 능력치
    exp: int                           # 계산된 EXP
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

    payload = await AIService.request_stat_conversion(request.log_text)
    percentages = {key: max(0, getattr(payload, key)) for key in STAT_KEYS}
    budget = _calculate_stat_budget(request.duration_minutes)
    stats = _distribute_budget(percentages, budget)
    exp = _calculate_exp(stats)

    return StatDebugResponse(
        log_text=request.log_text,
        duration_minutes=request.duration_minutes,
        gcp_percentages=percentages,
        percentage_sum=sum(percentages.values()),
        stat_budget=round(budget, 4),
        distributed_stats=stats,
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
