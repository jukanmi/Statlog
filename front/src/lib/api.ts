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
 * 백엔드 미구현 시 0으로 채워진 기본값을 반환한다.
 */
export async function convertStudyToStats(
  payload: StudySessionPayload
): Promise<StatConversionResult> {
  try {
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
  } catch (error) {
    console.warn('Backend study sessions API failed, using empty gains:', error);
    return {
      HUM: 0, SOC: 0, NAT: 0, COL: 0, PER: 0, ART: 0, EXP: 0
    };
  }
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

/**
 * 내 프로필 정보 조회
 * 백엔드: GET /api/v1/users/me
 * 백엔드 미구현 시 Mock 데이터를 반환한다.
 */
export async function getUserProfile(token: string) {
  try {
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

    const data = await res.json();
    
    // 백엔드 데이터에 필수 필드(stats 등)가 없을 경우 Mock과 합성
    return {
      id: data.id || 'user-001',
      nickname: data.nickname || '탐험가',
      profileImage: data.profile_image || null,
      stats: data.stats || { HUM: 50, SOC: 0, NAT: 10, COL: 0, PER: 0, ART: 0 },
      aiStats: data.aiStats || { HUM: 0, SOC: 0, NAT: 0, COL: 0, PER: 0, ART: 0, EXP: 0 },
      gold: data.gold ?? 1200,
      gems: data.gems ?? 30,
      level: data.level ?? 7,
      exp: data.exp ?? 340,
    };
  } catch (error) {
    console.warn('Backend profile API failed, using mock data:', error);
    // 백엔드가 아예 안 켜져 있거나 401/404일 때 반환할 완전한 Mock 데이터
    return {
      id: 'user-001',
      nickname: '탐험가(Mock)',
      profileImage: null,
      stats: { HUM: 50, SOC: 0, NAT: 10, COL: 0, PER: 0, ART: 0 },
      aiStats: { HUM: 0, SOC: 0, NAT: 0, COL: 0, PER: 0, ART: 0, EXP: 0 },
      gold: 1200,
      gems: 30,
      level: 7,
      exp: 340,
    };
  }
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
