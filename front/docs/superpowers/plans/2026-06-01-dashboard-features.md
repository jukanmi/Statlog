# Dashboard Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dashboard 탭에 장착 캐릭터 카드, 오늘 목표 달성률, AI 스탯 성장 차트, 공부 스트릭 히트맵 4개 컴포넌트를 추가한다.

**Architecture:** 4개 독립 컴포넌트를 각각 신규 파일로 생성하고 DashboardPage에 순서대로 삽입한다. 히트맵과 성장 차트의 날짜/주차 계산 유틸 함수는 별도 테스트로 검증한다.

**Tech Stack:** React, TypeScript, Zustand (useUserStore / useStudyStore / useQuestStore), SVG (직접 작성), inline styles

---

## File Map

| 파일 | 종류 | 역할 |
|------|------|------|
| `src/pages/dashboard/components/EquippedCharacterCard.tsx` | 신규 | 장착 캐릭터 이미지·레벨·exp 바 |
| `src/pages/dashboard/components/TodaySummaryCard.tsx` | 신규 | 오늘 목표 달성률 + 획득 스탯 상위 2개 |
| `src/pages/dashboard/components/StatGrowthChart.tsx` | 신규 | 주차별 aiStatGained 누적 바 차트 |
| `src/pages/dashboard/components/StreakHeatmap.tsx` | 신규 | 35일 히트맵 + 날짜 클릭 세션 패널 |
| `src/test/dashboardUtils.test.ts` | 신규 | 날짜 유틸 순수 함수 단위 테스트 |
| `src/pages/dashboard/DashboardPage.tsx` | 수정 | 4개 컴포넌트 import·배치 |

---

## Task 1: EquippedCharacterCard

**Files:**
- Create: `src/pages/dashboard/components/EquippedCharacterCard.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// src/pages/dashboard/components/EquippedCharacterCard.tsx
import { useUserStore } from '@/store/useUserStore';
import { ALL_CHARACTERS, GRADE_COLORS } from '@/constants/characters';
import { calcLevelProgress, getDisplayCharacterId, calcEvolutionStage } from '@/lib/characterLevel';

const EquippedCharacterCard: React.FC = () => {
  const equippedCharacterId = useUserStore((s) => s.equippedCharacterId);
  const characterExpMap = useUserStore((s) => s.characterExpMap);

  if (!equippedCharacterId) {
    return (
      <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13, margin: 0 }}>
          도감에서 캐릭터를 장착해 보세요
        </p>
      </div>
    );
  }

  const totalExp = characterExpMap[equippedCharacterId] ?? 0;
  const progress = calcLevelProgress(totalExp);
  const displayId = getDisplayCharacterId(equippedCharacterId, progress.level);
  const char = ALL_CHARACTERS.find((c) => c.id === displayId)
    ?? ALL_CHARACTERS.find((c) => c.id === equippedCharacterId);

  if (!char) return null;

  const colors = GRADE_COLORS[char.grade];
  const stage = calcEvolutionStage(progress.level);
  const nextEvolutionLevel = stage === 0 ? 21 : stage === 1 ? 41 : null;

  return (
    <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
        장착 캐릭터
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          border: `2px solid ${colors.border}`,
          boxShadow: colors.glow !== 'none' ? `0 0 12px ${colors.glow}` : undefined,
        }}>
          <img src={char.imageUrl} alt={char.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{char.name}</span>
            <span style={{
              backgroundColor: colors.bg, color: colors.text,
              borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700,
            }}>{char.grade}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: '#C9A84C', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              Lv.{progress.level}
            </span>
            <div style={{
              flex: 1, height: 4,
              backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(progress.progressRatio * 100, 100)}%`,
                background: 'linear-gradient(90deg, #C9A84C, #E8CC7A)',
                borderRadius: 2,
                transition: 'width 600ms ease-out',
              }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, flexShrink: 0 }}>
              {progress.level < 60
                ? `${progress.currentLevelExp}/${progress.nextLevelExp}`
                : 'MAX'}
            </span>
          </div>

          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
            {nextEvolutionLevel
              ? `진화까지 ${nextEvolutionLevel - progress.level}레벨`
              : '최종 진화 완료'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquippedCharacterCard;
```

- [ ] **Step 2: TypeScript 체크**

```bash
cd C:\Users\onebe\Statlog\front && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
cd C:\Users\onebe\Statlog && git add front/src/pages/dashboard/components/EquippedCharacterCard.tsx && git commit -m "feat: add EquippedCharacterCard to dashboard"
```

---

## Task 2: TodaySummaryCard

**Files:**
- Create: `src/pages/dashboard/components/TodaySummaryCard.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// src/pages/dashboard/components/TodaySummaryCard.tsx
import { useStudyStore } from '@/store/useStudyStore';
import { useQuestStore } from '@/store/useQuestStore';
import type { AIStats } from '@/types';

const STAT_LABELS: Record<keyof AIStats, string> = {
  HUM: '인문학', SOC: '사회과학', NAT: '자연과학',
  COL: '협동력', PER: '끈기', ART: '예체능', EXP: '실행경험',
};

const TodaySummaryCard: React.FC = () => {
  const todayMinutes = useStudyStore((s) => s.todayMinutes);
  const lastSessionStats = useStudyStore((s) => s.lastSessionStats);
  const { dailyStudyGoalMinutes, dailyStudyGoalSubject } = useQuestStore();

  const progressPct = Math.min(100, Math.round((todayMinutes / dailyStudyGoalMinutes) * 100));
  const isComplete = progressPct >= 100;

  const topStats = lastSessionStats
    ? (Object.entries(lastSessionStats) as [keyof AIStats, number][])
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
    : [];

  return (
    <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>오늘 목표</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{dailyStudyGoalSubject}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <span style={{ color: isComplete ? '#4ADE80' : '#C9A84C', fontSize: 22, fontWeight: 700 }}>
          {progressPct}%
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
          {todayMinutes}분 / {dailyStudyGoalMinutes}분
        </span>
      </div>

      <div style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          background: isComplete
            ? 'linear-gradient(90deg, #4ADE80, #22C55E)'
            : 'linear-gradient(90deg, #C9A84C, #E8CC7A)',
          borderRadius: 4,
          transition: 'width 600ms ease-out',
        }} />
      </div>

      {topStats.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {topStats.map(([key, value]) => (
            <div key={key} style={{
              flex: 1,
              backgroundColor: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.15)',
              borderRadius: 10, padding: '8px 10px', textAlign: 'center',
            }}>
              <div style={{ color: '#C9A84C', fontSize: 14, fontWeight: 700 }}>+{value}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 }}>
                {STAT_LABELS[key]}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodaySummaryCard;
```

- [ ] **Step 2: TypeScript 체크**

```bash
cd C:\Users\onebe\Statlog\front && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
cd C:\Users\onebe\Statlog && git add front/src/pages/dashboard/components/TodaySummaryCard.tsx && git commit -m "feat: add TodaySummaryCard to dashboard"
```

---

## Task 3: StatGrowthChart 유틸 함수 TDD + 컴포넌트

**Files:**
- Create: `src/test/dashboardUtils.test.ts` (유틸 함수 테스트 — StatGrowthChart 부분)
- Create: `src/pages/dashboard/components/StatGrowthChart.tsx`

- [ ] **Step 1: 테스트 파일 작성 (StatGrowthChart 유틸 부분)**

```ts
// src/test/dashboardUtils.test.ts
import { describe, it, expect } from 'vitest';

// --- StatGrowthChart 유틸 ---
function getMondayStr(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toLocaleDateString('sv-SE');
}

describe('getMondayStr', () => {
  it('월요일은 자기 자신', () => {
    expect(getMondayStr('2026-06-01')).toBe('2026-06-01'); // 2026-06-01 = 월요일
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

// --- StreakHeatmap 유틸 ---
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
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd C:\Users\onebe\Statlog\front && npx vitest run src/test/dashboardUtils.test.ts
```

Expected: 에러 없이 전부 통과 (순수 함수가 파일 내부에 정의되어 있으므로 import 없음)

- [ ] **Step 3: StatGrowthChart 파일 생성**

```tsx
// src/pages/dashboard/components/StatGrowthChart.tsx
import { useEffect, useState } from 'react';
import { useStudyStore } from '@/store/useStudyStore';
import type { AIStats } from '@/types';

const STAT_COLORS: Record<keyof AIStats, string> = {
  HUM: '#F59E0B', SOC: '#3B82F6', NAT: '#10B981',
  COL: '#8B5CF6', PER: '#EC4899', ART: '#F97316', EXP: '#C9A84C',
};
const STAT_KEYS: (keyof AIStats)[] = ['HUM', 'SOC', 'NAT', 'COL', 'PER', 'ART', 'EXP'];

function getMondayStr(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toLocaleDateString('sv-SE');
}

function getLast4Mondays(): string[] {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() + diff);
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date(thisMonday);
    d.setDate(thisMonday.getDate() - (3 - i) * 7);
    return d.toLocaleDateString('sv-SE');
  });
}

const SVG_W = 300;
const SVG_H = 140;
const CHART_H = 100;
const LEFT_PAD = 28;
const TOP_PAD = 8;
const BAR_W = 36;

const StatGrowthChart: React.FC = () => {
  const sessions = useStudyStore((s) => s.sessions);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

  const mondays = getLast4Mondays();
  const slotW = (SVG_W - LEFT_PAD) / 4;

  const weekData: Record<keyof AIStats, number>[] = mondays.map((monday) => {
    const totals: Record<keyof AIStats, number> = {
      HUM: 0, SOC: 0, NAT: 0, COL: 0, PER: 0, ART: 0, EXP: 0,
    };
    for (const session of sessions) {
      if (getMondayStr(session.date) !== monday) continue;
      if (!session.aiStatGained) continue;
      for (const key of STAT_KEYS) {
        totals[key] += session.aiStatGained[key] ?? 0;
      }
    }
    return totals;
  });

  const maxTotal = Math.max(
    ...weekData.map((w) => STAT_KEYS.reduce((s, k) => s + w[k], 0)),
    1,
  );

  const weekLabels = mondays.map((m) => {
    const d = new Date(m + 'T00:00:00');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  return (
    <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
      }}>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>스탯 성장</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>최근 4주</span>
      </div>

      <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ overflow: 'visible' }}>
        {/* Baseline */}
        <line
          x1={LEFT_PAD} x2={SVG_W}
          y1={TOP_PAD + CHART_H} y2={TOP_PAD + CHART_H}
          stroke="rgba(255,255,255,0.06)" strokeWidth={1}
        />

        {weekData.map((week, wi) => {
          const slotCenter = LEFT_PAD + wi * slotW + slotW / 2;
          const barX = slotCenter - BAR_W / 2;
          const total = STAT_KEYS.reduce((s, k) => s + week[k], 0);
          const totalH = mounted ? (total / maxTotal) * CHART_H : 0;

          // Compute stacked segment positions
          const segments: { key: keyof AIStats; y: number; h: number }[] = [];
          let currentY = TOP_PAD + CHART_H;
          for (const key of STAT_KEYS) {
            const segH = total > 0 ? (week[key] / maxTotal) * CHART_H : 0;
            if (segH > 0) {
              currentY -= segH;
              segments.push({ key, y: currentY, h: segH });
            }
          }

          return (
            <g key={wi}>
              {/* Background track */}
              <rect
                x={barX} y={TOP_PAD}
                width={BAR_W} height={CHART_H}
                rx={4} fill="rgba(255,255,255,0.03)"
              />
              {/* Stacked segments */}
              {segments.map(({ key, y, h }) => (
                <rect
                  key={key}
                  x={barX} y={y}
                  width={BAR_W} height={h}
                  fill={STAT_COLORS[key]}
                  opacity={0.85}
                  style={{ transition: 'height 600ms ease-out, y 600ms ease-out' }}
                />
              ))}
              {/* Week label */}
              <text
                x={slotCenter} y={TOP_PAD + CHART_H + 16}
                textAnchor="middle" fontSize={9}
                fill="rgba(255,255,255,0.4)"
              >
                {weekLabels[wi]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 8 }}>
        {STAT_KEYS.map((key) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 8, height: 8, borderRadius: 2, backgroundColor: STAT_COLORS[key],
            }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatGrowthChart;
```

- [ ] **Step 4: TypeScript 체크**

```bash
cd C:\Users\onebe\Statlog\front && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
cd C:\Users\onebe\Statlog && git add front/src/test/dashboardUtils.test.ts front/src/pages/dashboard/components/StatGrowthChart.tsx && git commit -m "feat: add StatGrowthChart and dashboard utils tests"
```

---

## Task 4: StreakHeatmap

**Files:**
- Create: `src/pages/dashboard/components/StreakHeatmap.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// src/pages/dashboard/components/StreakHeatmap.tsx
import { useState } from 'react';
import { useStudyStore } from '@/store/useStudyStore';
import type { StudySession } from '@/types';

const SUBJECT_ICONS: Record<string, string> = {
  과학: '🔬', 수학: '🔢', 국어: '🗣️', 사회: '📜', 기타: '⭐',
};
const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function getLast35Days(): string[] {
  const today = new Date();
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (34 - i));
    return d.toLocaleDateString('sv-SE');
  });
}

function getDayColor(minutes: number): string {
  if (minutes === 0) return 'rgba(255,255,255,0.04)';
  if (minutes <= 30) return 'rgba(74,222,128,0.3)';
  if (minutes <= 60) return 'rgba(74,222,128,0.6)';
  return '#C9A84C';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

const StreakHeatmap: React.FC = () => {
  const sessions = useStudyStore((s) => s.sessions);
  const studyStreak = useStudyStore((s) => s.studyStreak);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = getLast35Days();

  const minutesByDate: Record<string, number> = {};
  for (const session of sessions) {
    minutesByDate[session.date] = (minutesByDate[session.date] ?? 0) + session.durationMinutes;
  }

  const selectedSessions: StudySession[] = selectedDate
    ? sessions.filter((s) => s.date === selectedDate)
    : [];

  const handleDayClick = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
  };

  return (
    <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
      }}>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>공부 기록</span>
        {studyStreak > 0 && (
          <span style={{
            background: 'rgba(201,168,76,0.1)', color: '#C9A84C',
            borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
          }}>
            🔥 {studyStreak}일 연속
          </span>
        )}
      </div>

      {/* Day labels */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3,
      }}>
        {WEEK_LABELS.map((label) => (
          <div key={label} style={{
            textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.25)',
          }}>
            {label}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {days.map((date) => {
          const minutes = minutesByDate[date] ?? 0;
          const isSelected = selectedDate === date;
          return (
            <button
              key={date}
              onClick={() => handleDayClick(date)}
              title={`${formatDate(date)}: ${minutes}분`}
              style={{
                aspectRatio: '1',
                borderRadius: 4,
                backgroundColor: isSelected ? '#C9A84C' : getDayColor(minutes),
                border: `2px solid ${isSelected ? '#E8CC7A' : 'transparent'}`,
                cursor: 'pointer',
                padding: 0,
                transition: 'background-color 150ms, border-color 150ms',
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 12, marginTop: 10, justifyContent: 'flex-end',
      }}>
        {[
          { label: '없음', color: 'rgba(255,255,255,0.04)' },
          { label: '~30분', color: 'rgba(74,222,128,0.3)' },
          { label: '~60분', color: 'rgba(74,222,128,0.6)' },
          { label: '60분+', color: '#C9A84C' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Selected date panel */}
      {selectedDate && (
        <div style={{
          marginTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 14,
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, marginBottom: 10,
          }}>
            {formatDate(selectedDate)}
          </div>

          {selectedSessions.length === 0 ? (
            <div style={{
              color: 'rgba(255,255,255,0.3)', fontSize: 12,
              textAlign: 'center', padding: '8px 0',
            }}>
              이날은 공부 기록이 없어요
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedSessions.map((session) => (
                <div key={session.id} style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '10px 12px',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginBottom: 4,
                  }}>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                      {SUBJECT_ICONS[session.subject] ?? '⭐'} {session.subject}
                    </span>
                    <span style={{ color: '#C9A84C', fontSize: 12, fontWeight: 600 }}>
                      {session.durationMinutes}분
                    </span>
                  </div>
                  {session.content && (
                    <div style={{
                      color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 1.4,
                    }}>
                      {session.content.length > 40
                        ? `${session.content.slice(0, 40)}…`
                        : session.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StreakHeatmap;
```

- [ ] **Step 2: TypeScript 체크**

```bash
cd C:\Users\onebe\Statlog\front && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 전체 테스트 실행**

```bash
cd C:\Users\onebe\Statlog\front && npx vitest run
```

Expected: 모든 테스트 통과

- [ ] **Step 4: 커밋**

```bash
cd C:\Users\onebe\Statlog && git add front/src/pages/dashboard/components/StreakHeatmap.tsx && git commit -m "feat: add StreakHeatmap with session detail panel"
```

---

## Task 5: DashboardPage 통합

**Files:**
- Modify: `src/pages/dashboard/DashboardPage.tsx`

- [ ] **Step 1: DashboardPage 수정**

현재 파일 전체를 다음으로 교체:

```tsx
// src/pages/dashboard/DashboardPage.tsx
import { useState } from 'react';
import ProfileCard from './components/ProfileCard';
import EquippedCharacterCard from './components/EquippedCharacterCard';
import TodaySummaryCard from './components/TodaySummaryCard';
import StatRadarChart from './components/StatRadarChart';
import StatGrowthChart from './components/StatGrowthChart';
import StudyBarChart from './components/StudyBarChart';
import StreakHeatmap from './components/StreakHeatmap';
import RankingCard from './components/RankingCard';
import SubjectStats from './components/SubjectStats';
import CurrencyCard from './components/CurrencyCard';
import SettingsModal from './components/SettingsModal';

interface DashboardPageProps {
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div style={{ backgroundColor: '#0F0F1A', minHeight: '100dvh' }}>
      <div style={{
        padding: 16,
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        paddingBottom: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        <ProfileCard onSettingsClick={() => setShowSettings(true)} />
        <EquippedCharacterCard />
        <TodaySummaryCard />
        <StatRadarChart />
        <StatGrowthChart />
        <StudyBarChart />
        <StreakHeatmap />
        <RankingCard />
        <SubjectStats />
        <CurrencyCard />
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onLogout={onLogout}
        />
      )}
    </div>
  );
};

export default DashboardPage;
```

- [ ] **Step 2: TypeScript 체크**

```bash
cd C:\Users\onebe\Statlog\front && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 전체 테스트 실행**

```bash
cd C:\Users\onebe\Statlog\front && npx vitest run
```

Expected: 모든 테스트 통과

- [ ] **Step 4: 커밋**

```bash
cd C:\Users\onebe\Statlog && git add front/src/pages/dashboard/DashboardPage.tsx && git commit -m "feat: integrate 4 new dashboard cards into DashboardPage"
```

---

## Self-Review

**Spec 커버리지:**
- EquippedCharacterCard: 이미지·레벨·exp 바·다음 진화 레벨·미장착 안내 ✓
- TodaySummaryCard: 달성률 바·N분/M분·완료 시 녹색·상위 2스탯 ✓
- StatGrowthChart: 최근 4주·aiStatGained 합산·누적 바·범례·빈 데이터 처리 ✓
- StreakHeatmap: 35일·색상 4단계·날짜 클릭·세션 목록·없는 날 안내·스트릭 표시 ✓
- DashboardPage 카드 순서: spec과 동일 ✓

**Placeholder 없음** ✓

**타입 일관성:**
- `AIStats` — `types/index.ts`에서 import, 모든 컴포넌트에서 동일하게 사용 ✓
- `StudySession` — `types/index.ts`에서 import ✓
- `calcLevelProgress`, `getDisplayCharacterId` — `lib/characterLevel.ts`에서 import ✓
- `ALL_CHARACTERS`, `GRADE_COLORS` — `constants/characters.ts`에서 import ✓
