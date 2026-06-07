import { EVOLUTION_CHAIN } from '../constants/characters';

export function expRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor((6 / 5) * level ** 3 - 15 * level ** 2 + 100 * level - 140);
}

export function calcLevel(totalExp: number): number {
  for (let n = 60; n >= 2; n--) {
    if (totalExp >= expRequiredForLevel(n)) return n;
  }
  return 1;
}

export function calcLevelProgress(totalExp: number): {
  level: number;
  progressRatio: number;
  currentLevelExp: number;
  nextLevelExp: number;
} {
  const level = calcLevel(totalExp);
  if (level >= 60) {
    return { level: 60, progressRatio: 1, currentLevelExp: 0, nextLevelExp: 0 };
  }
  const currentFloor = expRequiredForLevel(level);
  const nextFloor = expRequiredForLevel(level + 1);
  const currentLevelExp = totalExp - currentFloor;
  const nextLevelExp = nextFloor - currentFloor;
  return {
    level,
    progressRatio: currentLevelExp / nextLevelExp,
    currentLevelExp,
    nextLevelExp,
  };
}

export function calcExpMultiplier(opts: {
  subjectMatch: boolean;
  quizCorrectRatio: number;
  potionMultiplier: number;
}): number {
  let base = 1.0;
  if (opts.subjectMatch) base += 0.5;
  if (opts.quizCorrectRatio >= 1.0) base += 0.5;
  else if (opts.quizCorrectRatio >= 0.5) base += 0.3;
  return base * opts.potionMultiplier;
}

export function calcExpGain(durationMinutes: number, multiplier: number): number {
  return Math.max(0, Math.floor(durationMinutes * 2 * multiplier));
}

export function calcEvolutionStage(level: number): 0 | 1 | 2 {
  if (level >= 41) return 2;
  if (level >= 21) return 1;
  return 0;
}

export function getDisplayCharacterId(baseId: string, level: number): string {
  const stage = calcEvolutionStage(level);
  if (stage === 0) return baseId;
  const first = EVOLUTION_CHAIN[baseId];
  if (!first) return baseId;
  if (stage === 1) return first;
  const second = EVOLUTION_CHAIN[first];
  return second ?? first;
}
