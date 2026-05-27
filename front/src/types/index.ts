export interface Stats {
  INT: number;
  STR: number;
  END: number;
  AGI: number;
  CHA: number;
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
  answer: string;
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
  aiStatGained?: Partial<AIStats>;
}

export interface Character {
  id: string;
  name: string;
  grade: 'S' | 'A' | 'B' | 'C';
  imageUrl: string;
  isOwned: boolean;
  description: string;
}
