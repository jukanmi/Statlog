import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { syncUserToServer } from '@/lib/api';
import { useStudyStore } from '@/store/useStudyStore';
import type { AIStats } from '@/types';
import type { StatConversionResult } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';
import { getRandomTip } from '@/constants/studyTips';

interface StatUpdateScreenProps {
  subject: string;
  elapsedSeconds: number;
  statGained: StatConversionResult | null; // AI가 반환한 stat_gained (성공 시)
  loading: boolean;                        // AI 변환 요청 진행 중
  error: string | null;                    // AI 변환 실패 메시지
  onDone: () => void;
}

interface StatGain {
  key: keyof AIStats;
  delta: number;
}

const STAT_KEYS: (keyof AIStats)[] = ['HUM', 'SOC', 'NAT', 'COL', 'PER', 'ART', 'EXP'];

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

/**
 * 숫자가 올라가는 애니메이션 컴포넌트
 */
const AnimatedNumber = ({
  value, 
  start = 0, 
  duration = 800, 
  delay = 0,
  prefix = "", 
  suffix = "" 
}: { 
  value: number; 
  start?: number;
  duration?: number; 
  delay?: number;
  prefix?: string; 
  suffix?: string; 
}) => {
  const [displayValue, setDisplayValue] = useState(start);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let animationFrameId: number;

    const startAnimation = () => {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing function: easeOutExpo
        const easeOutExpo = (x: number): number => {
          return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
        };
        
        const currentProgress = easeOutExpo(progress);
        setDisplayValue(Math.floor(start + currentProgress * (value - start)));
        
        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(step);
        }
      };
      animationFrameId = window.requestAnimationFrame(step);
    };

    if (delay > 0) {
      timeoutId = setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [value, start, duration, delay]);

  return <>{prefix}{displayValue}{suffix}</>;
};

const StatUpdateSkeleton = () => {
  return (
    <div style={{ padding: '0 24px', paddingTop: 'calc(64px + env(safe-area-inset-top))', maxWidth: 430, margin: '0 auto' }}>
      {/* Header Skeleton */}
      <div style={{ marginBottom: 24 }}>
        <Skeleton className="h-8 w-48 bg-white/10 mb-2" />
        <Skeleton className="h-4 w-32 bg-white/5" />
      </div>

      {/* EXP Banner Skeleton */}
      <Skeleton className="h-[60px] w-full bg-white/5 rounded-xl mb-4" />

      {/* Stat Card Skeletons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#1A1A2E',
              borderRadius: 16,
              padding: '18px 20px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
                <div>
                  <Skeleton className="h-4 w-12 bg-white/10 mb-1" />
                  <Skeleton className="h-3 w-16 bg-white/5" />
                </div>
              </div>
              <Skeleton className="h-6 w-12 bg-white/10" />
            </div>
            <Skeleton className="h-1.5 w-full bg-white/5 rounded-full mb-2" />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Skeleton className="h-3 w-10 bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatUpdateScreen: React.FC<StatUpdateScreenProps> = ({
  subject,
  elapsedSeconds,
  statGained,
  loading,
  error,
  onDone,
}) => {
  const userAIStats = useUserStore((s) => s.user.aiStats);
  const addAIStats = useUserStore((s) => s.addAIStats);
  const addExp = useUserStore((s) => s.addExp);
  const lastSessionStats = useStudyStore((s) => s.lastSessionStats);
  const [animated, setAnimated] = useState(false);
  const [applied, setApplied] = useState(false);
  const [currentTip, setCurrentTip] = useState(getRandomTip());

  // AI가 반환한 능력치 중 0보다 큰 항목만 추출 (Prop 우선, 없으면 Store 확인)
  const statGains: StatGain[] = [];

  console.log('[StatDebug] StatUpdateScreen props — loading:', loading, '/ error:', error, '/ statGained:', statGained);

  const effectiveStats = statGained ?? lastSessionStats ?? null;

  if (effectiveStats) {
    STAT_KEYS.forEach((key) => {
      if ((effectiveStats[key] ?? 0) > 0) {
        statGains.push({ key, delta: effectiveStats[key] ?? 0 });
      }
    });
  }
  console.log('[StatDebug] statGains (0 초과 항목):', statGains);

  const expGained = effectiveStats?.EXP ?? 0;

  // statGained가 도착하면 단 한 번만 스토어에 반영하고 서버 동기화
  useEffect(() => {
    if (!applied) {
      if (statGained) {
        addAIStats(statGained);
        addExp(statGained.EXP ?? 0);
        setApplied(true);
        const { user } = useUserStore.getState();
        syncUserToServer({ ai_stats: user.aiStats, exp: user.exp });
      } else if (lastSessionStats) {
        addAIStats(lastSessionStats);
        addExp(lastSessionStats.EXP ?? 0);
        setApplied(true);
        const { user } = useUserStore.getState();
        syncUserToServer({ ai_stats: user.aiStats, exp: user.exp });
      }
    }
  }, [statGained, lastSessionStats, applied, addAIStats, addExp]);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let tipInterval: ReturnType<typeof setInterval> | undefined;
    if (loading) {
      setCurrentTip(getRandomTip());
      tipInterval = setInterval(() => {
        setCurrentTip(getRandomTip());
      }, 5000);
    }
    return () => clearInterval(tipInterval);
  }, [loading]);

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
    overflowY: 'auto',
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

  // --- 로딩: AI 변환 요청 중 (스켈레톤 적용) ---
  if (loading) {
    return (
      <div style={containerStyle}>
        <StatUpdateSkeleton />
        <div style={{ position: 'absolute', bottom: 'calc(48px + env(safe-area-inset-bottom))', left: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Study Tip Box */}
          <div
            style={{
              backgroundColor: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.15)',
              borderRadius: 16,
              padding: '16px 20px',
              display: 'flex',
              gap: 14,
              animation: 'fadeIn 300ms ease-out',
            }}
          >
            <Lightbulb size={22} style={{ color: '#C9A84C', flexShrink: 0, marginTop: 2 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                오늘의 학습 팁
              </span>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6, animation: 'tipIn 500ms ease-out' }} key={currentTip}>
                {currentTip}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#C9A84C', fontWeight: 600, margin: 0, animation: 'pulse 2s infinite' }}>
              AI가 학습 내용을 정밀 분석 중입니다...
            </p>
            <Skeleton className="h-[52px] w-full bg-white/5 rounded-xl mt-4" />
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes tipIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
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
  if (statGains.length === 0) {
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
            animation: 'bannerIn 500ms ease-out',
          }}
        >
          <span style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 600 }}>경험치 획득</span>
          <span style={{ fontSize: 18, color: '#A78BFA', fontWeight: 700 }}>
            <AnimatedNumber value={expGained} prefix="+" suffix=" EXP" delay={300} />
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {statGains.map(({ key, delta }, idx) => {
          const currentValue = userAIStats[key] ?? 0;
          const originalValue = Math.max(0, currentValue - delta);
          const targetValue = Math.min(currentValue, 100);
          const barWidth = animated ? `${targetValue}%` : `${Math.min(originalValue, 100)}%`;

          return (
            <div
              key={key}
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 16,
                padding: '18px 20px',
                border: '1px solid rgba(255,255,255,0.08)',
                animation: `cardIn 500ms ease-out ${idx * 100}ms both`,
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
                  <span>
                    <AnimatedNumber value={delta} prefix="+" suffix="%" delay={400 + idx * 100} />
                  </span>
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
                    transition: 'width 1000ms cubic-bezier(0.22, 1, 0.36, 1)',
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
                총 <AnimatedNumber value={currentValue} start={originalValue} suffix="%" delay={400 + idx * 100} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Done button */}
      {doneButton}

      <style>{`
        @keyframes bannerIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateX(-15px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default StatUpdateScreen;
