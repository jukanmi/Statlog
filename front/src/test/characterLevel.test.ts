import { describe, it, expect } from 'vitest';
import {
  expRequiredForLevel,
  calcLevel,
  calcLevelProgress,
  calcExpMultiplier,
  calcExpGain,
  calcEvolutionStage,
  getDisplayCharacterId,
} from '@/lib/characterLevel';

describe('expRequiredForLevel', () => {
  it('레벨 1은 0 exp', () => {
    expect(expRequiredForLevel(1)).toBe(0);
  });
  it('레벨 2는 9 exp', () => {
    expect(expRequiredForLevel(2)).toBe(9);
  });
  it('레벨 10은 560 exp', () => {
    expect(expRequiredForLevel(10)).toBe(560);
  });
  it('레벨 20은 5460 exp (1단계 최대)', () => {
    expect(expRequiredForLevel(20)).toBe(5460);
  });
  it('레벨 21은 6458 exp (2단계 시작)', () => {
    expect(expRequiredForLevel(21)).toBe(6458);
  });
  it('레벨 40은 56660 exp (2단계 최대)', () => {
    expect(expRequiredForLevel(40)).toBe(56660);
  });
  it('레벨 60은 211060 exp (최대)', () => {
    expect(expRequiredForLevel(60)).toBe(211060);
  });
});

describe('calcLevel', () => {
  it('exp 0 → 레벨 1', () => {
    expect(calcLevel(0)).toBe(1);
  });
  it('exp 8 → 레벨 1 (9 미만)', () => {
    expect(calcLevel(8)).toBe(1);
  });
  it('exp 9 → 레벨 2', () => {
    expect(calcLevel(9)).toBe(2);
  });
  it('exp 5460 → 레벨 20', () => {
    expect(calcLevel(5460)).toBe(20);
  });
  it('exp 5461 → 레벨 20 (21레벨 6458 미달)', () => {
    expect(calcLevel(5461)).toBe(20);
  });
  it('exp 6458 → 레벨 21', () => {
    expect(calcLevel(6458)).toBe(21);
  });
  it('exp 211060 → 레벨 60 (최대)', () => {
    expect(calcLevel(211060)).toBe(60);
  });
  it('exp 999999 → 레벨 60 (초과해도 60 고정)', () => {
    expect(calcLevel(999999)).toBe(60);
  });
});

describe('calcLevelProgress', () => {
  it('레벨 1, exp 0 → progressRatio 0', () => {
    const p = calcLevelProgress(0);
    expect(p.level).toBe(1);
    expect(p.progressRatio).toBe(0);
    expect(p.currentLevelExp).toBe(0);
    expect(p.nextLevelExp).toBe(9);
  });
  it('레벨 60 도달 → progressRatio 1', () => {
    const p = calcLevelProgress(211060);
    expect(p.level).toBe(60);
    expect(p.progressRatio).toBe(1);
  });
});

describe('calcExpMultiplier', () => {
  it('기본 조건 → 1.0x', () => {
    expect(calcExpMultiplier({ subjectMatch: false, quizCorrectRatio: 0, potionMultiplier: 1.0 })).toBeCloseTo(1.0);
  });
  it('과목 일치 → 1.5x', () => {
    expect(calcExpMultiplier({ subjectMatch: true, quizCorrectRatio: 0, potionMultiplier: 1.0 })).toBeCloseTo(1.5);
  });
  it('퀴즈 60% → +0.3x', () => {
    expect(calcExpMultiplier({ subjectMatch: false, quizCorrectRatio: 0.6, potionMultiplier: 1.0 })).toBeCloseTo(1.3);
  });
  it('퀴즈 100% → +0.5x (50% 보너스 대체)', () => {
    expect(calcExpMultiplier({ subjectMatch: false, quizCorrectRatio: 1.0, potionMultiplier: 1.0 })).toBeCloseTo(1.5);
  });
  it('과목 일치 + 퀴즈 100% + 물약 없음 → 2.0x', () => {
    expect(calcExpMultiplier({ subjectMatch: true, quizCorrectRatio: 1.0, potionMultiplier: 1.0 })).toBeCloseTo(2.0);
  });
  it('과목 일치 + 퀴즈 100% + 물약 1.5x → 3.0x', () => {
    expect(calcExpMultiplier({ subjectMatch: true, quizCorrectRatio: 1.0, potionMultiplier: 1.5 })).toBeCloseTo(3.0);
  });
});

describe('calcExpGain', () => {
  it('60분 × 2.0 배율 → 240 exp', () => {
    expect(calcExpGain(60, 2.0)).toBe(240);
  });
  it('30분 × 1.5 배율 → 90 exp', () => {
    expect(calcExpGain(30, 1.5)).toBe(90);
  });
  it('소수점은 버림', () => {
    expect(calcExpGain(1, 1.3)).toBe(2);
  });
});

describe('calcEvolutionStage', () => {
  it('레벨 1 → 0단계', () => expect(calcEvolutionStage(1)).toBe(0));
  it('레벨 20 → 0단계', () => expect(calcEvolutionStage(20)).toBe(0));
  it('레벨 21 → 1단계', () => expect(calcEvolutionStage(21)).toBe(1));
  it('레벨 40 → 1단계', () => expect(calcEvolutionStage(40)).toBe(1));
  it('레벨 41 → 2단계', () => expect(calcEvolutionStage(41)).toBe(2));
  it('레벨 60 → 2단계', () => expect(calcEvolutionStage(60)).toBe(2));
});

describe('getDisplayCharacterId', () => {
  it('레벨 10 → 기본 이미지 (char_1)', () => {
    expect(getDisplayCharacterId('char_1', 10)).toBe('char_1');
  });
  it('레벨 25 → 1차 진화 (char_5)', () => {
    expect(getDisplayCharacterId('char_1', 25)).toBe('char_5');
  });
  it('레벨 45 → 2차 진화 (char_9)', () => {
    expect(getDisplayCharacterId('char_1', 45)).toBe('char_9');
  });
  it('체인 끝 캐릭터는 자기 자신 반환', () => {
    expect(getDisplayCharacterId('char_9', 45)).toBe('char_9');
  });
  it('체인에 없는 캐릭터는 자기 자신 반환', () => {
    expect(getDisplayCharacterId('char_99', 45)).toBe('char_99');
  });
});
