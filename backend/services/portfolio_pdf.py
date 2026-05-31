"""학습 포트폴리오 PDF 렌더러.

LLM이 생성한 포트폴리오(PortfolioPayload)와 유저 스탯·과목별 학습시간을 받아
fpdf2로 PDF 바이트를 생성한다. 한글은 malgun.ttf를 등록해 렌더한다.
"""

import logging
import os

from fpdf import FPDF

from AI_routers.ai_service import PortfolioPayload

logger = logging.getLogger("services.portfolio_pdf")

# 한글 폰트 경로 — Windows 기본 맑은 고딕. 운영 배포 시 env로 교체하거나 폰트 번들 필요.
_FONT_PATH = os.getenv("PORTFOLIO_FONT_PATH", "C:/Windows/Fonts/malgun.ttf")
_FONT_NAME = "Malgun"

# 6대 능력치 라벨 (ai_log.py / 프론트와 동일 체계).
_STAT_LABELS: dict[str, str] = {
    "HUM": "인문학",
    "SOC": "사회과학",
    "NAT": "자연과학",
    "COL": "협동력",
    "PER": "끈기",
    "ART": "예체능",
}
_STAT_KEYS = ("HUM", "SOC", "NAT", "COL", "PER", "ART")


class _PortfolioPDF(FPDF):
    """한글 폰트를 등록한 FPDF. 폰트가 없으면 헬베티카로 폴백한다."""

    def __init__(self) -> None:
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=True, margin=15)
        self._has_kr = os.path.exists(_FONT_PATH)
        if self._has_kr:
            # fpdf2는 uni=True가 기본(레거시 인자 제거됨) — TTF만 등록하면 된다.
            self.add_font(_FONT_NAME, "", _FONT_PATH)
            self.add_font(_FONT_NAME, "B", _FONT_PATH)
        else:
            logger.warning(
                "한글 폰트를 찾을 수 없어 헬베티카로 폴백합니다 (한글이 깨질 수 있음): %s",
                _FONT_PATH,
            )

    def kfont(self, size: int, bold: bool = False) -> None:
        """한글 가능 폰트(또는 폴백)를 지정한다."""
        if self._has_kr:
            self.set_font(_FONT_NAME, "B" if bold else "", size)
        else:
            self.set_font("Helvetica", "B" if bold else "", size)


def _section_title(pdf: _PortfolioPDF, text: str) -> None:
    pdf.ln(3)
    pdf.set_text_color(201, 168, 76)  # 골드 액센트
    pdf.kfont(13, bold=True)
    pdf.cell(0, 8, text, new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(30, 30, 40)


def _bullet_list(pdf: _PortfolioPDF, items: list[str]) -> None:
    pdf.kfont(11)
    for item in items:
        pdf.multi_cell(0, 7, f"- {item}", new_x="LMARGIN", new_y="NEXT")


def render_portfolio_pdf(
    payload: PortfolioPayload,
    *,
    nickname: str,
    level: int,
    exp: int,
    ai_stats: dict,
    subject_minutes: dict[str, int],
) -> bytes:
    """포트폴리오 + 스탯을 A4 PDF 바이트로 렌더한다."""
    from datetime import date

    pdf = _PortfolioPDF()
    pdf.add_page()

    # --- 헤더 ---
    pdf.set_text_color(30, 30, 40)
    pdf.kfont(20, bold=True)
    pdf.cell(0, 12, f"{nickname} 님의 학습 포트폴리오", new_x="LMARGIN", new_y="NEXT")
    pdf.kfont(10)
    pdf.set_text_color(120, 120, 130)
    pdf.cell(
        0, 6,
        f"Lv.{level}  |  EXP {exp}  |  생성일 {date.today().isoformat()}",
        new_x="LMARGIN", new_y="NEXT",
    )
    pdf.set_text_color(30, 30, 40)

    # --- 요약 ---
    _section_title(pdf, "요약")
    pdf.kfont(11)
    pdf.multi_cell(0, 7, payload.summary, new_x="LMARGIN", new_y="NEXT")

    # --- 6대 능력치 ---
    _section_title(pdf, "능력치 (AI 분석)")
    pdf.kfont(11)
    for key in _STAT_KEYS:
        val = int(ai_stats.get(key, 0) or 0)
        label = _STAT_LABELS[key]
        pdf.cell(50, 7, f"{label} ({key})", border=0)
        # 간단한 막대 + 수치
        bar_w = min(val, 100) * 1.0  # 100% → 100mm
        y = pdf.get_y()
        x = pdf.get_x()
        pdf.set_fill_color(201, 168, 76)
        if bar_w > 0:
            pdf.rect(x, y + 1, bar_w * 0.8, 4, style="F")
        pdf.set_x(x + 82)
        pdf.cell(0, 7, f"{val}%", new_x="LMARGIN", new_y="NEXT")

    # --- 과목별 학습시간 ---
    if subject_minutes:
        _section_title(pdf, "과목별 학습시간")
        pdf.kfont(11)
        for subject, minutes in sorted(
            subject_minutes.items(), key=lambda kv: kv[1], reverse=True
        ):
            hours = minutes / 60
            pdf.cell(
                0, 7, f"- {subject}: {minutes}분 ({hours:.1f}시간)",
                new_x="LMARGIN", new_y="NEXT",
            )

    # --- 강점 ---
    if payload.strengths:
        _section_title(pdf, "강점")
        _bullet_list(pdf, payload.strengths)

    # --- 과목별 분석 ---
    if payload.subject_analysis:
        _section_title(pdf, "과목별 분석")
        pdf.kfont(11)
        for sa in payload.subject_analysis:
            pdf.multi_cell(
                0, 7, f"[{sa.subject}] {sa.comment}",
                new_x="LMARGIN", new_y="NEXT",
            )

    # --- 추천 진로 ---
    if payload.recommended_paths:
        _section_title(pdf, "추천 진로")
        _bullet_list(pdf, payload.recommended_paths)

    # --- 키워드 ---
    if payload.keywords:
        _section_title(pdf, "키워드")
        pdf.kfont(11)
        pdf.multi_cell(0, 7, "  ·  ".join(payload.keywords), new_x="LMARGIN", new_y="NEXT")

    # fpdf2: output()은 bytearray 반환 → bytes로 변환
    return bytes(pdf.output())
