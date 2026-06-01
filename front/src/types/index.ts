import { z } from 'zod';

// --- AI Stats Schema ---
export const aiStatsSchema = z.object({
  HUM: z.number().default(0),
  SOC: z.number().default(0),
  NAT: z.number().default(0),
  COL: z.number().default(0),
  PER: z.number().default(0),
  ART: z.number().default(0),
  EXP: z.number().default(0),
});

export type AIStats = z.infer<typeof aiStatsSchema>;

// --- AI Quiz Item Schema ---
export const aiQuizItemSchema = z.object({
  question: z.string().min(1, "질문은 필수입니다."),
  choices: z.array(z.string()).length(4, "보기는 반드시 4개여야 합니다."),
  answer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().default("해설이 제공되지 않았습니다."),
});

export const aiQuizResponseSchema = z.object({
  items: z.array(aiQuizItemSchema),
});

export type AIQuizItem = z.infer<typeof aiQuizItemSchema>;

// --- Existing Types ---
export interface Stats {
  HUM: number;
  SOC: number;
  NAT: number;
  COL: number;
  PER: number;
  ART: number;
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

export interface Character {
  id: string;
  name: string;
  grade: 'S' | 'A' | 'B' | 'C';
  subject: string;
  description: string;
  imageUrl: string;
}

export type QuizType = 'multiple' | 'short';

export interface Quiz {
  id: string;
  type: QuizType;
  question: string;
  options?: string[];
  correctIndex?: number;
  answer?: string | number;
  hint?: string;
  subject?: string;
}

export interface UserQuiz extends Quiz {
  subject: string;
  createdAt: string;
}
