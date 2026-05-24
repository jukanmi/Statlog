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
  return data.quizzes.map((q) => ({
    question: q.question,
    options: q.options,
    correctIndex: q.correct_index,
  }));
}

// ================= 🧬 캐릭터 경험치 및 진화 정산 인터페이스 파트 =================

export interface CharacterExpRequest {
  characterId: string;
  expGained: number;
}

export interface CharacterExpResponse {
  characterId: string;
  currentExp: number;
  isEvolved: boolean;
  evolvedToId: string | null;
  message: string;
}

/**
 * 📡 [API] 장착 마스코트의 경험치 적립 수치를 백엔드 DB와 동기화하고 진화 상태를 서버에서 검증합니다.
 */
export async function updateCharacterExpOnServer(payload: CharacterExpRequest): Promise<CharacterExpResponse> {
  // 🔗 추후 실제 백엔드 연동 오픈 시 주석 해제하여 활성화
  /*
  const response = await fetch(`${API_BASE_URL}/api/v1/characters/gain-exp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      character_id: payload.characterId,
      exp_gained: payload.expGained
    })
  });
  if (!response.ok) throw new Error("캐릭터 경험치 동기화 실패");
  return response.json();
  */

  // 🧪 [프론트엔드 단독 테스트 지원 가상 네트워크 딜레이 구현]
  await new Promise((resolve) => setTimeout(resolve, 200));
  
  return {
    characterId: payload.characterId,
    currentExp: payload.expGained,
    isEvolved: false,
    evolvedToId: null,
    message: "로컬 모킹 API 가상 동기화 성공."
  };
}