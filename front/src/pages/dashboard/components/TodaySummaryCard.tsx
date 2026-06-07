import { useStudyStore } from '@/store/useStudyStore';
import { useQuestStore } from '@/store/useQuestStore';
import type { AIStats } from '@/types';

const STAT_LABELS: Record<keyof AIStats, string> = {
  HUM: '인문학',
  SOC: '사회과학',
  NAT: '자연과학',
  COL: '협동력',
  PER: '끈기',
  ART: '예체능',
  EXP: '실행경험',
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>오늘 목표</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
          {dailyStudyGoalSubject}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            color: isComplete ? '#4ADE80' : '#C9A84C',
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          {progressPct}%
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
          {todayMinutes}분 / {dailyStudyGoalMinutes}분
        </span>
      </div>

      <div
        style={{
          height: 8,
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background: isComplete
              ? 'linear-gradient(90deg, #4ADE80, #22C55E)'
              : 'linear-gradient(90deg, #C9A84C, #E8CC7A)',
            borderRadius: 4,
            transition: 'width 600ms ease-out',
          }}
        />
      </div>

      {topStats.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {topStats.map(([key, value]) => (
            <div
              key={key}
              style={{
                flex: 1,
                backgroundColor: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.15)',
                borderRadius: 10,
                padding: '8px 10px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#C9A84C', fontSize: 14, fontWeight: 700 }}>
                +{value}
              </div>
              <div
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
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
