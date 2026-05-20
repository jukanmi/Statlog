export interface Stats {
  INT: number;
  STR: number;
  END: number;
  AGI: number;
  CHA: number;
}

export type QuizType = 'multiple' | 'short';

export interface Quiz {
  id: string;
  type?: QuizType;
  question: string;
  options?: string[];
  correctIndex?: number;
  answer?: string;
  hint?: string;
}

export interface UserQuiz {
  id: string;
  subject: string;
  type: QuizType;
  question: string;
  options?: string[];
  correctIndex?: number;
  answer?: string;
  hint?: string;
  createdAt: string;
}

export interface User {
  id: string;
  nickname: string;
  profileImage: string | null;
  stats: Stats;
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
}

export interface Character {
  id: string;
  name: string;
  grade: 'S' | 'A' | 'B' | 'C';
  imageUrl: string;
  isOwned: boolean;
  description: string;
}
