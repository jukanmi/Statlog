// 백엔드 AI(StatResponse)와 동일한 6대 능력치 체계
export interface Stats {
  HUM: number; // 인문학 (Humanities)
  SOC: number; // 사회과학 (Social Sciences)
  NAT: number; // 자연과학 (Natural Sciences)
  COL: number; // 협동력 (Collaboration)
  PER: number; // 끈기 (Perseverance)
  ART: number; // 예체능 (Arts & Physical Education)
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
  expGained?: number;
}

export interface Character {
  id: string;
  name: string;
  grade: 'S' | 'A' | 'B' | 'C';
  imageUrl: string;
  isOwned: boolean;
  description: string;
}
