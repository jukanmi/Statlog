import { apiClient } from './apiClient';
import type { Stats, AIStats } from '@/types';

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
 */
export async function convertStudyToStats(
  payload: StudySessionPayload
): Promise<StatConversionResult> {
  try {
    const data = await apiClient.post<StudySessionResponse>('/api/v1/study/sessions', {
      subject: payload.subject,
      content: payload.content,
      duration_minutes: payload.durationMinutes,
      date: payload.date,
    });

    return data.stat_gained;
  } catch (error) {
    console.error('convertStudyToStats error:', error);
    // Fallback Mock Data
    return {
      HUM: 1, SOC: 1, NAT: 1, COL: 1, PER: 1, ART: 1, EXP: 10
    };
  }
}

// --- AI 퀴즈 생성 ---
export interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface QuizApiResponse {
  quizzes: {
    question: string;
    options: string[];
    correct_index: number;
    explanation?: string;
  }[];
}

/**
 * 사용자의 학습 내용을 백엔드에 보내 AI가 생성한 4지선다 복습 퀴즈를 받아온다.
 */
export async function generateQuiz(content: string): Promise<Quiz[]> {
  try {
    const data = await apiClient.post<QuizApiResponse>('/api/v1/ai/quiz', { content });

    return data.quizzes.map((q) => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correct_index,
    }));
  } catch (error) {
    console.error('generateQuiz (api.ts) error:', error);
    // Fallback Mock Data with "timeout" in title
    return [
      {
        question: `[timeout] 서버 연결이 원활하지 않아 준비된 기본 퀴즈: '${content.slice(0, 15)}...' 학습을 완료했나요?`,
        options: ['네, 완료했습니다.', '조금 더 봐야겠어요.', '나중에 다시 할래요.', '잘 모르겠어요.'],
        correctIndex: 0,
      }
    ];
  }
}

/**
 * 내 프로필 정보 조회
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

    if (res.status === 401 || res.status === 403) {
      throw new Error(`UNAUTHORIZED`);
    }

    if (!res.ok) {
      throw new Error(`프로필 조회 실패 (HTTP ${res.status})`);
    }

    const data = await res.json();
    return {
      id: data.id || 'user-001',
      nickname: data.nickname || '탐험가',
      profileImage: data.profile_image || null,
      stats: data.stats || { HUM: 0, SOC: 0, NAT: 0, COL: 0, PER: 0, ART: 0 },
      aiStats: data.ai_stats || { HUM: 0, SOC: 0, NAT: 0, COL: 0, PER: 0, ART: 0, EXP: 0 },
      gold: data.gold ?? 1000,
      gems: data.gems ?? 30,
      level: data.level ?? 1,
      exp: data.exp ?? 0,
      owned_characters_bits: data.owned_characters_bits ?? 7,
      equipped_character_id: data.equipped_character_id ?? 'char_1',
      character_exp_map: data.character_exp_map ?? {},
      study_streak: data.study_streak ?? 0,
      last_attendance_date: data.last_attendance_date ?? null,
    };
  } catch (error) {
    throw error;
  }
}

export async function saveStudySessionWithStats(payload: {
  subject: string;
  content: string;
  durationMinutes: number;
  date: string;
  quizResults: boolean[];
}): Promise<StatConversionResult> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/api/v1/study/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      subject: payload.subject,
      content: payload.content,
      duration_minutes: payload.durationMinutes,
      date: payload.date,
      quiz_results: payload.quizResults,
    }),
  });
  if (!res.ok) throw new Error(`세션 저장 실패 (HTTP ${res.status})`);
  const data = await res.json();
  return data.stat_gained as StatConversionResult;
}

// ================= 유저 퀴즈 =================

export async function fetchUserQuizzes() {
  const token = localStorage.getItem('access_token');
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function saveQuizToServer(quiz: {
  id: string; subject: string; type: string; question: string;
  options?: string[]; correct_index?: number;
  answer?: string; hint?: string; created_at: string;
}) {
  const token = localStorage.getItem('access_token');
  if (!token) return;
  try {
    await fetch(`${API_BASE_URL}/api/v1/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(quiz),
    });
  } catch (e) { console.warn('퀴즈 저장 실패:', e); }
}

export async function deleteQuizFromServer(quizId: string) {
  const token = localStorage.getItem('access_token');
  if (!token) return;
  try {
    await fetch(`${API_BASE_URL}/api/v1/quizzes/${quizId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) { console.warn('퀴즈 삭제 실패:', e); }
}

export async function voteQuizOnServer(quizId: string, vote: 'up' | 'down') {
  const token = localStorage.getItem('access_token');
  if (!token) return;
  const res = await fetch(`${API_BASE_URL}/api/v1/quizzes/${quizId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ vote }),
  });
  if (!res.ok) throw new Error('서버 퀴즈 투표 처리 실패');
}

export async function reportQuizOnServer(quizId: string) {
  const token = localStorage.getItem('access_token');
  if (!token) return;
  const res = await fetch(`${API_BASE_URL}/api/v1/quizzes/${quizId}/report`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('서버 퀴즈 신고 처리 실패');
}

// ================= 공부 세션 =================

export interface ServerStudySession {
  id: string;
  subject: string;
  content: string;
  duration_minutes: number;
  date: string;
}

export async function fetchStudySessions(): Promise<ServerStudySession[]> {
  const token = localStorage.getItem('access_token');
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/study/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

// ================= 캐릭터 비트마스크 유틸 =================

export function encodeBitmask(characterIds: string[]): number {
  return characterIds.reduce((bits, id) => {
    const n = parseInt(id.replace('char_', ''), 10);
    return isNaN(n) ? bits : bits | (1 << (n - 1));
  }, 0);
}

export function decodeBitmask(bits: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < 12; i++) {
    if (bits & (1 << i)) ids.push(`char_${i + 1}`);
  }
  return ids;
}

// ================= 유저 상태 서버 동기화 =================

export interface UserSyncPayload {
  gold?: number;
  gems?: number;
  level?: number;
  exp?: number;
  study_streak?: number;
  last_attendance_date?: string | null;
  stats?: Partial<Stats>;
  ai_stats?: Record<string, number>;
  nickname?: string;
  profile_image?: string | null;
  owned_characters_bits?: number;
  equipped_character_id?: string | null;
  character_exp_map?: Record<string, number>;
}

export async function syncUserToServer(payload: UserSyncPayload): Promise<void> {
  const token = localStorage.getItem('access_token');
  if (!token) return;
  try {
    await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) { console.warn('유저 상태 동기화 실패:', e); }
}

export interface CharacterExpRequest { characterId: string; expGained: number; }
export interface CharacterExpResponse { characterId: string; currentExp: number; isEvolved: boolean; evolvedToId: string | null; message: string; }

export async function updateCharacterExpOnServer(payload: CharacterExpRequest): Promise<CharacterExpResponse> {
  return apiClient.post<CharacterExpResponse>('/api/v1/characters/gain-exp', {
    character_id: payload.characterId,
    exp_gained: payload.expGained
  });
}

export async function downloadPortfolioPdf(): Promise<Blob> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/api/v1/users/me/portfolio/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`포트폴리오 생성 실패 (HTTP ${res.status})`);
  return res.blob();
}

// ================= 👥 파티 & 랭킹 연동 API 명세 파트 =================

export interface ServerParty {
  id: string;
  name: string;
  max_member_count: number;
  leader_id: string;
  member_count?: number;
  weekly_minutes?: number;
}

export interface RankingItem {
  userId: string;
  nickname: string;
  rank: number;
  percentage: number;
  category: string;
  score: number;
}

export async function fetchMyParty(): Promise<ServerParty | null> {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/parties/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('파티 조회 실패');
    return await res.json();
  } catch { return null; }
}

export async function createPartyOnServer(name: string, maxMemberCount: number): Promise<ServerParty> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/api/v1/parties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, max_member_count: maxMemberCount }),
  });
  
  if (!res.ok) {
    const err = await res.json();
    let errMsg = '파티 생성 실패';
    // 🛠️ [Object Object] 방지용 상세 에러 스트링 파서 주입
    if (err.detail) {
      if (typeof err.detail === 'string') errMsg = err.detail;
      else if (Array.isArray(err.detail)) errMsg = err.detail.map((d: any) => `${d.loc?.join('.')} : ${d.msg}`).join('\n');
      else errMsg = JSON.stringify(err.detail);
    }
    throw new Error(errMsg);
  }
  return await res.json();
}

export async function createPartyInvite(partyId: string, expiresInDays: number = 7, maxUseCount: number = 10) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/api/v1/parties/${partyId}/invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ expires_in_days: expiresInDays, max_use_count: maxUseCount }),
  });
  if (!res.ok) throw new Error('초대 생성 실패');
  return await res.json();
}

export async function joinPartyByInviteCode(inviteCode: string): Promise<ServerParty> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/api/v1/party-invites/${inviteCode}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || '가입 실패'); }
  return await res.json();
}

export async function leavePartyOnServer(partyId: string): Promise<void> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/api/v1/parties/${partyId}/members/me`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.detail || '탈퇴 실패'); }
}

export async function fetchCategoryRankings(category: string): Promise<RankingItem[]> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/api/v1/analytics/rankings?category=${encodeURIComponent(category)}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error('랭킹 지표 호출 실패');
  return await res.json();
}