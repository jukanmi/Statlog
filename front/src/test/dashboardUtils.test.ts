import { describe, it, expect } from 'vitest';
import { getMondayStr } from '@/lib/dashboardUtils';

function getLast35Days(today: string): string[] {
  const base = new Date(today + 'T00:00:00');
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() - (34 - i));
    return d.toLocaleDateString('sv-SE');
  });
}

function getDayColor(minutes: number): string {
  if (minutes === 0) return 'rgba(255,255,255,0.04)';
  if (minutes <= 30) return 'rgba(74,222,128,0.3)';
  if (minutes <= 60) return 'rgba(74,222,128,0.6)';
  return '#C9A84C';
}

describe('getMondayStr', () => {
  it('월요일은 자기 자신', () => {
    expect(getMondayStr('2026-06-01')).toBe('2026-06-01');
  });
  it('수요일 → 해당 주 월요일', () => {
    expect(getMondayStr('2026-06-03')).toBe('2026-06-01');
  });
  it('일요일 → 해당 주 월요일 (6일 전)', () => {
    expect(getMondayStr('2026-06-07')).toBe('2026-06-01');
  });
  it('토요일 → 해당 주 월요일 (5일 전)', () => {
    expect(getMondayStr('2026-06-06')).toBe('2026-06-01');
  });
});

describe('getLast35Days', () => {
  it('항상 35개를 반환한다', () => {
    expect(getLast35Days('2026-06-01')).toHaveLength(35);
  });
  it('마지막 원소가 today이다', () => {
    const days = getLast35Days('2026-06-01');
    expect(days[34]).toBe('2026-06-01');
  });
  it('첫 원소는 34일 전이다', () => {
    const days = getLast35Days('2026-06-01');
    expect(days[0]).toBe('2026-04-28');
  });
});

describe('getDayColor', () => {
  it('0분 → 어두운 회색', () => {
    expect(getDayColor(0)).toBe('rgba(255,255,255,0.04)');
  });
  it('1분 → 연초록', () => {
    expect(getDayColor(1)).toBe('rgba(74,222,128,0.3)');
  });
  it('30분 → 연초록', () => {
    expect(getDayColor(30)).toBe('rgba(74,222,128,0.3)');
  });
  it('31분 → 중간초록', () => {
    expect(getDayColor(31)).toBe('rgba(74,222,128,0.6)');
  });
  it('60분 → 중간초록', () => {
    expect(getDayColor(60)).toBe('rgba(74,222,128,0.6)');
  });
  it('61분 → 골드', () => {
    expect(getDayColor(61)).toBe('#C9A84C');
  });
});
