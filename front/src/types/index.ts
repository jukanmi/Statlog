// 백엔드 AI(StatResponse)와 동일한 6대 능력치 체계
export interface Stats {
  HUM: number; // 인문학 (Humanities)
  SOC: number; // 사회과학 (Social Sciences)
  NAT: number; // 자연과학 (Natural Sciences)
  COL: number; // 협동력 (Collaboration)
  PER: number; // 끈기 (Perseverance)
  ART: number; // 예체능 (Arts & Physical Education)
}

export interface AIStats {
  HUM: number;
  SOC: number;
  NAT: number;
  COL: number;
  PER: number;
  ART: number;
  EXP: number;
}

export interface AIQuizItem {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface User {
  id: string;
  nickname: string;
  profileImage: string | null;
  stats: Stats;
  aiStats: AIStats;
  gold: number;
  gems: number;
  level: number;
  exp: number;
}

export interface StudySession {
  id: string;
  subject: string;
  content: string;
  durationMinutes: number;
  date: string;
  statGained: Partial<Stats>;
  expGained?: number;
  aiStatGained?: Partial<AIStats>;
}

export type QuizType = 'multiple' | 'short';

export interface UserQuiz {
  id: string;
  createdAt: string;
  subject: string;
  type: QuizType;
  question: string;
  // 객관식
  options?: string[];
  correctIndex?: number;
  // 주관식
  answer?: string;
  hint?: string;
}

export interface Character {
  id: string;
  name: string;
  grade: 'S' | 'A' | 'B' | 'C';
  imageUrl: string;
  isOwned: boolean;
  description: string;
}
