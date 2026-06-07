import { Character } from '@/types';
import { ALL_CHARACTERS } from '@/constants/characters';

export function pullOne(): Character {
  const rand = Math.random();
  let grade: 'S' | 'A' | 'B' | 'C' = 'C';
  
  if (rand < 0.03) grade = 'S';
  else if (rand < 0.15) grade = 'A';
  else if (rand < 0.5) grade = 'B';
  
  const pool = ALL_CHARACTERS.filter(c => c.grade === grade);
  return pool[Math.floor(Math.random() * pool.length)] || ALL_CHARACTERS[0];
}

export function pullTen(): Character[] {
  return Array.from({ length: 10 }, () => pullOne());
}
