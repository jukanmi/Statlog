export interface Stats {
  INT: number;
  STR: number;
  END: number;
  AGI: number;
  CHA: number;
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
