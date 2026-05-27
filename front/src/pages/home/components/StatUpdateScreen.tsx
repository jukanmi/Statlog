import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useStudyStore } from '@/store/useStudyStore';
import type { Stats, AIStats } from '@/types';
import type { StatConversionResult } from '@/lib/api';

interface StatUpdateScreenProps {
  subject: string;
  elapsedSeconds: number;
  statGained: StatConversionResult | null; // AI가 반환한 stat_gained (성공 시)
  loading: boolean;                        // AI 변환 요청 진행 중
  error: string | null;                    // AI 변환 실패 메시지
  onDone: () => void;
}

type StatKey = keyof Stats;
type AIStatKey = keyof AIStats;

interface StatGain {
  key: AIStatKey;
  delta: number;
}

const STAT_KEYS: StatKey[] = ['HUM', 'SOC', 'NAT', 'COL', 'PER', 'ART'];

const STAT_LABELS: Record<AIStatKey, string> = {
  HUM: '인문학',
  SOC: '사회과학',
  NAT: '자연과학',
  COL: '협동력',
  PER: '끈기',
  ART: '예체능',
  EXP: '실행경험',
};

const STAT_ICONS: Record<AIStatKey, string> = {
  HUM: '📖',
  SOC: '🏛️',
  NAT: '🔬',
  COL: '🤝',
  PER: '🔥',
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

const StatUpdateScreen: React.FC<StatUpdateScreenProps> = ({
  subject,
  elapsedSeconds,
  statGained,
  loading,
  error,
  onDone,
}) => {
  const userStats = useUserStore((s) => s.user.stats);
  const userAIStats = useUserStore((s) => s.user.aiStats);
  const addStats = useUserStore((s) => s.addStats);
  const addAIStats = useUserStore((s) => s.addAIStats);
  const addExp = useUserStore((s) => s.addExp);
  const lastSessionStats = useStudyStore((s) => s.lastSessionStats);
  
  const [animated, setAnimated] = useState(false);
  const [applied, setApplied] = useState(false);

  // AI가 반환한 능력치 중 0보다 큰 항목만 추출 (Prop 우선, 없으면 Store 확인)
  const statGains: StatGain[] = [];
  
  if (statGained) {
    STAT_KEYS.forEach((key) => {
      if ((statGained[key] ?? 0) > 0) {
        statGains.push({ key, delta: statGained[key] ?? 0 });
      }
    });
  } else if (lastSessionStats) {
    (Object.entries(lastSessionStats) as [AIStatKey, number][]).forEach(([key, delta]) => {
      if (delta > 0) {
        statGains.push({ key, delta });
      }
    });
  }

  const expGained = statGained?.EXP ?? lastSessionStats?.EXP ?? 0;

  // statGained나 lastSessionStats가 도착하면 단 한 번만 스토어에 반영
  useEffect(() => {
    if (!applied) {
      if (statGained) {
        addStats(
          STAT_KEYS.reduce<Partial<Stats>>((acc, key) => {
            acc[key] = statGained[key] ?? 0;
            return acc;
          }, {})
        );
        addExp(statGained.EXP ?? 0);
        setApplied(true);
      } else if (lastSessionStats) {
        addAIStats(lastSessionStats);
        setApplied(true);
      }
    }
  }, [statGained, lastSessionStats, applied, addStats, addAIStats, addExp]);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
  }, [statGained, lastSessionStats]);

  const containerStyle: React.CSSProperties = {
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
  };

  const doneButton = (
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
  );

  // --- 로딩: AI 변환 요청 중 ---
  if (loading) {
    return (
      <div style={{ ...containerStyle, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🤖</div>
        <p style={{ fontSize: 16, color: '#FFFFFF', fontWeight: 600, margin: 0 }}>
          AI가 학습 내용을 분석하고 있어요...
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          잠시만 기다려 주세요
        </p>
      </div>
    );
  }

  // --- 에러: AI 변환 실패 ---
  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>⚠️</div>
          <p style={{ fontSize: 16, color: '#FFFFFF', fontWeight: 600, margin: 0, textAlign: 'center' }}>
            스탯 분석에 실패했어요
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8, textAlign: 'center' }}>
            {error}
          </p>
        </div>
        {doneButton}
      </div>
    );
  }

  // --- 정답 0개 등으로 stat_gained가 없는 경우 ---
  if (!statGained || statGains.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>📚</div>
          <p style={{ fontSize: 16, color: '#FFFFFF', fontWeight: 600, margin: 0, textAlign: 'center' }}>
            이번엔 스탯을 획득하지 못했어요
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8, textAlign: 'center' }}>
            퀴즈를 맞히면 AI가 스탯을 분석해 줘요
          </p>
        </div>
        {doneButton}
      </div>
    );
  }

  // --- 정상: AI가 반환한 스탯 표시 ---
  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: 0, marginBottom: 8 }}>
          스탯이 올랐어요! ✨
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          {subject} · {formatDuration(elapsedSeconds)} 학습
        </p>
      </div>

      {/* EXP 획득 배너 */}
      {expGained > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(167,139,250,0.12)',
            border: '1px solid rgba(167,139,250,0.4)',
            borderRadius: 14,
            padding: '14px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 600 }}>경험치 획득</span>
          <span style={{ fontSize: 18, color: '#A78BFA', fontWeight: 700 }}>+{expGained} EXP</span>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' }}>
        {statGains.map(({ key, delta }) => {
          // Use userStats if it's a standard stat, else userAIStats
          const currentValue = STAT_KEYS.includes(key as StatKey) 
            ? userStats[key as StatKey] 
            : userAIStats[key as AIStatKey] ?? 0;
          
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
      {doneButton}
    </div>
  );
};

export default StatUpdateScreen;
