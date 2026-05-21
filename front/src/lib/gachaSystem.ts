export type GachaCharacter = {
  id: string;
  name: string;
  grade: 'S' | 'A' | 'B' | 'C';
  subject: string;
};

export const GRADE_COLORS: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  S: { bg: '#2D1B69', border: '#7C3AED', glow: 'rgba(124,58,237,0.5)', text: '#D8B4E2' },
  A: { bg: '#1E293B', border: '#3B82F6', glow: 'rgba(59,130,246,0.5)', text: '#93C5FD' },
  B: { bg: '#1A1A2E', border: '#22C55E', glow: 'rgba(34,197,94,0.5)', text: '#86EFAC' },
  C: { bg: '#1A1A2E', border: '#6B7280', glow: 'none', text: '#D1D5DB' },
};

export const SUBJECT_ICONS: Record<string, string> = {
  math: '🔢',
  science: '🔬',
  history: '📜',
  language: '🗣️',
};

export const ALL_CHARACTERS: GachaCharacter[] = [
  { id: 'char_1', name: '알버트', grade: 'S', subject: 'science' },
  { id: 'char_2', name: '마리', grade: 'A', subject: 'science' },
  { id: 'char_3', name: '피타고라스', grade: 'S', subject: 'math' },
  { id: 'char_4', name: '유클리드', grade: 'A', subject: 'math' },
  { id: 'char_5', name: '세종대왕', grade: 'S', subject: 'language' },
  { id: 'char_6', name: '이순신', grade: 'A', subject: 'history' },
  { id: 'char_7', name: '장영실', grade: 'B', subject: 'science' },
  { id: 'char_8', name: '허준', grade: 'B', subject: 'science' },
  { id: 'char_9', name: '신사임당', grade: 'B', subject: 'language' },
  { id: 'char_10', name: '김구', grade: 'C', subject: 'history' },
];

export function pullOne(): GachaCharacter {
  const rand = Math.random();
  let grade = 'C';
  if (rand < 0.03) grade = 'S';
  else if (rand < 0.15) grade = 'A';
  else if (rand < 0.5) grade = 'B';
  
  const pool = ALL_CHARACTERS.filter(c => c.grade === grade);
  return pool[Math.floor(Math.random() * pool.length)] || ALL_CHARACTERS[0];
}

export function pullTen(): GachaCharacter[] {
  return Array.from({ length: 10 }, () => pullOne());
}
