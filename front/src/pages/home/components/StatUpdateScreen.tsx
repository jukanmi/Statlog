import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import type { Stats, StudyDepth } from '@/types';

const DEPTH_MULTIPLIERS: Record<StudyDepth, number> = {
  memorize: 1.0,
  understand: 1.2,
  apply: 1.5,
};

const DEPTH_LABELS: Record<StudyDepth, string> = {
  memorize: '암기',
  understand: '이해',
  apply: '응용',
};

interface StatUpdateScreenProps {
  subject: string;
  elapsedSeconds: number;
  depth?: StudyDepth;
  onDone: () => void;
}

type StatKey = keyof Stats;

interface StatGain {
  key: StatKey;
  delta: number;
}

const STAT_GAINS: Record<string, Partial<Stats>> = {
  수학: { INT: 2, END: 1 },
  과학: { INT: 2, END: 1 },
  프로그래밍: { INT: 2, END: 1 },
  영어: { INT: 1, CHA: 2, END: 1 },
  국어: { INT: 1, CHA: 2, END: 1 },
  사회: { CHA: 1, INT: 1, END: 1 },
  기타: { INT: 1, END: 1 },
};

const STAT_LABELS: Record<StatKey, string> = {
  INT: '지식력',
  STR: '근력',
  END: '지구력',
  AGI: '민첩성',
  CHA: '매력',
};

const STAT_ICONS: Record<StatKey, string> = {
  INT: '🧠',
  STR: '⚡',
  END: '🛡️',
  AGI: '💨',
  CHA: '✨',
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}초`;
  if (s === 0) return `${m}분`;
  return `${m}분 ${s}초`;
}

const StatUpdateScreen: React.FC<StatUpdateScreenProps> = ({ subject, elapsedSeconds, depth, onDone }) => {
  const userStats = useUserStore((s) => s.user.stats);
  const addStats = useUserStore((s) => s.addStats);
  const [animated, setAnimated] = useState(false);
  const [applied, setApplied] = useState(false);

  const baseGains = STAT_GAINS[subject] ?? STAT_GAINS['기타'];
  const multiplier = depth ? DEPTH_MULTIPLIERS[depth] : 1;

  const statGains: StatGain[] = (Object.entries(baseGains) as [StatKey, number][]).map(
    ([key, delta]) => ({ key, delta: Math.round(delta * multiplier) })
  );

  const actualGains: Partial<Stats> = Object.fromEntries(
    statGains.map(({ key, delta }) => [key, delta])
  ) as Partial<Stats>;

  const totalPoints = statGains.reduce((sum, g) => sum + g.delta, 0);

  useEffect(() => {
    if (!applied) {
      addStats(actualGains);
      setApplied(true);
    }
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: '#0F0F1A',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 24px',
        paddingTop: 'calc(64px + env(safe-area-inset-top))',
        paddingBottom: 'calc(48px + env(safe-area-inset-bottom))',
        maxWidth: 430,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: 0, marginBottom: 8 }}>
          스탯이 올랐어요!
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          {subject} · {formatDuration(elapsedSeconds)} 학습
          {depth && (
            <span style={{ marginLeft: 8, color: '#C9A84C', fontWeight: 600 }}>
              [{DEPTH_LABELS[depth]} {DEPTH_MULTIPLIERS[depth] > 1 ? `x${DEPTH_MULTIPLIERS[depth]}` : ''}]
            </span>
          )}
        </p>
      </div>

      {/* Total EXP summary */}
      <div style={{
        backgroundColor: 'rgba(201,168,76,0.08)',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 14,
        padding: '14px 18px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>총 스탯 포인트 획득</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#C9A84C' }}>+{totalPoints}</span>
      </div>

      {/* Distribution bar */}
      {statGains.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden' }}>
            {statGains.map(({ key, delta }, i) => {
              const pct = Math.round((delta / totalPoints) * 100);
              const colors = ['#C9A84C', '#A78BFA', '#4ADE80', '#60A5FA', '#F97316'];
              return (
                <div
                  key={key}
                  style={{
                    width: animated ? `${pct}%` : '0%',
                    backgroundColor: colors[i % colors.length],
                    transition: `width 600ms ease-out ${i * 100}ms`,
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {statGains.map(({ key, delta }, i) => {
              const pct = Math.round((delta / totalPoints) * 100);
              const colors = ['#C9A84C', '#A78BFA', '#4ADE80', '#60A5FA', '#F97316'];
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors[i % colors.length] }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{key} {pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {statGains.map(({ key, delta }, _i) => {
          const currentValue = userStats[key];
          const targetValue = Math.min(currentValue, 100);
          const barWidth = animated ? `${targetValue}%` : '0%';

          return (
            <div
              key={key}
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 16,
                padding: '18px 20px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Row: icon + name on left, +delta on right */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{STAT_ICONS[key]}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{key}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                      {STAT_LABELS[key]}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#C9A84C',
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  <span style={{ fontSize: 14 }}>↑</span>
                  <span>+{delta}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 6,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: barWidth,
                    background: 'linear-gradient(90deg, #C9A84C 0%, #E8CC7A 100%)',
                    borderRadius: 3,
                    transition: 'width 600ms ease-out',
                  }}
                />
              </div>

              {/* Value label */}
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.25)',
                  marginTop: 6,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {currentValue} / 100
              </div>
            </div>
          );
        })}
      </div>

      {/* Done button */}
      <button
        onClick={onDone}
        style={{
          width: '100%',
          height: 52,
          backgroundColor: '#C9A84C',
          border: 'none',
          borderRadius: 14,
          color: '#0F0F1A',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          marginTop: 28,
          boxShadow: '0 0 24px rgba(201,168,76,0.35)',
          transition: 'transform 150ms ease',
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        홈으로 돌아가기
      </button>
    </div>
  );
};

export default StatUpdateScreen;
