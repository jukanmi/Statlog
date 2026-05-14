import type { Stats } from '@/types';

// 백엔드 주소 — .env의 VITE_API_BASE_URL로 덮어쓸 수 있고, 없으면 로컬 기본값
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// 백엔드 StatResponse: 6대 능력치 + EXP
export interface StatConversionResult extends Stats {
  EXP: number;
}

export interface StudySessionPayload {
  subject: string;
  content: string;
  durationMinutes: number;
  date: string; // 'YYYY-MM-DD'
}

interface StudySessionResponse {
  id: string;
  subject: string;
  stat_gained: StatConversionResult;
}

/**
 * 학습 세션을 백엔드에 보내 AI가 분석한 stat_gained(6대 능력치 + EXP)를 반환받는다.
 * 백엔드: POST /api/v1/study/sessions → AI_routers.analyze_log_to_stats
 */
export async function convertStudyToStats(
  payload: StudySessionPayload
): Promise<StatConversionResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/study/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: payload.subject,
      content: payload.content,
      duration_minutes: payload.durationMinutes,
      date: payload.date,
    }),
  });

  if (!res.ok) {
    throw new Error(`스탯 변환 요청 실패 (HTTP ${res.status})`);
  }

  const data: StudySessionResponse = await res.json();
  return data.stat_gained;
}
