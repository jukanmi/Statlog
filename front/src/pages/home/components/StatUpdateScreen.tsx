import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useStudyStore } from '@/store/useStudyStore';
import { AIStats } from '@/types';

interface StatUpdateScreenProps {
  subject: string;
  elapsedSeconds: number;
  onDone: () => void;
}

const STAT_LABELS: Record<keyof AIStats, string> = {
  HUM: '인문학',
  SOC: '사회과학',
  NAT: '자연과학',
  COL: '협업능력',
  PER: '개인성과',
  ART: '예술감각',
  EXP: '실행경험',
};

const STAT_ICONS: Record<keyof AIStats, string> = {
  HUM: '📚',
  SOC: '🌍',
  NAT: '🔬',
  COL: '🤝',
  PER: '🎯',
  ART: '🎨',
  EXP: '🚀',
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}초`;
  if (s === 0) return `${m}분`;
  return `${m}분 ${s}초`;
}

const StatUpdateScreen: React.FC<StatUpdateScreenProps> = ({ subject, elapsedSeconds, onDone }) => {
  const userAIStats = useUserStore((s) => s.user.aiStats);
  const addAIStats = useUserStore((s) => s.addAIStats);
  const lastSessionStats = useStudyStore((s) => s.lastSessionStats);
  const [animated, setAnimated] = useState(false);
  const [applied, setApplied] = useState(false);

  // Filter out zero gains for display
  const gains = lastSessionStats || { HUM: 0, SOC: 0, NAT: 0, COL: 0, PER: 0, ART: 0, EXP: 0 };
  const statGains = (Object.entries(gains) as [keyof AIStats, number][])
    .filter(([, delta]) => delta > 0)
    .map(([key, delta]) => ({ key, delta }));

  useEffect(() => {
    if (!applied && lastSessionStats) {
      addAIStats(lastSessionStats);
      setApplied(true);
    }
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSessionStats]);

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
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: 0, marginBottom: 8 }}>
          스탯이 올랐어요! ✨
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          {subject} · {formatDuration(elapsedSeconds)} 학습
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {statGains.length > 0 ? (
          statGains.map(({ key, delta }) => {
            const currentValue = userAIStats[key];
            const barWidth = animated ? `${Math.min(currentValue, 100)}%` : '0%';

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
                    <span>+{delta}%</span>
                  </div>
                </div>

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

                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.25)',
                    marginTop: 6,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  총 {currentValue}%
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>
            오른 스탯이 없습니다.
          </div>
        )}
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
