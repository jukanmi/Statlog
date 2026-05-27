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

// --- AI 퀴즈 생성 ---
export interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizApiResponse {
  quizzes: { question: string; options: string[]; correct_index: number }[];
}

/**
 * 사용자의 학습 내용을 백엔드에 보내 AI가 생성한 4지선다 복습 퀴즈를 받아온다.
 * 백엔드: POST /api/v1/ai/quiz → AI_routers.request_quiz_generation
 */
export async function generateQuiz(content: string): Promise<Quiz[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ai/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    throw new Error(`퀴즈 생성 요청 실패 (HTTP ${res.status})`);
  }

  const data: QuizApiResponse = await res.json();
  // 백엔드는 correct_index(snake_case) — 프론트 컨벤션(correctIndex)으로 변환
  return data.quizzes.map((q) => ({
    question: q.question,
    options: q.options,
    correctIndex: q.correct_index,
  }));
}

/**
 * 내 프로필 정보 조회
 * 백엔드: GET /api/v1/users/me
 */
export async function getUserProfile(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`프로필 조회 실패 (HTTP ${res.status})`);
  }

  return await res.json();
}
