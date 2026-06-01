import { useEffect, useState } from 'react';
import { useStudyStore } from '@/store/useStudyStore';
import type { AIStats } from '@/types';
import { getMondayStr } from '@/lib/dashboardUtils';

const STAT_COLORS: Record<keyof AIStats, string> = {
  HUM: '#F59E0B', SOC: '#3B82F6', NAT: '#10B981',
  COL: '#8B5CF6', PER: '#EC4899', ART: '#F97316', EXP: '#C9A84C',
};
const STAT_KEYS: (keyof AIStats)[] = ['HUM', 'SOC', 'NAT', 'COL', 'PER', 'ART', 'EXP'];

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
        <line
          x1={LEFT_PAD} x2={SVG_W}
          y1={TOP_PAD + CHART_H} y2={TOP_PAD + CHART_H}
          stroke="rgba(255,255,255,0.06)" strokeWidth={1}
        />

        {weekData.map((week, wi) => {
          const slotCenter = LEFT_PAD + wi * slotW + slotW / 2;
          const barX = slotCenter - BAR_W / 2;
          const total = STAT_KEYS.reduce((s, k) => s + week[k], 0);

          const segments: { key: keyof AIStats; y: number; h: number }[] = [];
          let currentY = TOP_PAD + CHART_H;
          for (const key of STAT_KEYS) {
            const segH = mounted && total > 0 ? (week[key] / maxTotal) * CHART_H : 0;
            if (segH > 0) {
              currentY -= segH;
              segments.push({ key, y: currentY, h: segH });
            }
          }

          return (
            <g key={wi}>
              <rect
                x={barX} y={TOP_PAD}
                width={BAR_W} height={CHART_H}
                rx={4} fill="rgba(255,255,255,0.03)"
              />
              {segments.map(({ key, y, h }) => (
                <rect
                  key={key}
                  x={barX} y={y}
                  width={BAR_W} height={h}
                  fill={STAT_COLORS[key]}
                  opacity={0.85}
                />
              ))}
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
