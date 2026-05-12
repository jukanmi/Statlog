import { useState, useEffect } from 'react';

interface DayData {
  label: string;
  minutes: number;
}

const MOCK_7: DayData[] = [
  { label: '월', minutes: 120 },
  { label: '화', minutes: 45 },
  { label: '수', minutes: 0 },
  { label: '목', minutes: 90 },
  { label: '금', minutes: 150 },
  { label: '토', minutes: 60 },
  { label: '일', minutes: 30 },
];

const MOCK_30_RAW = [90,60,120,0,80,150,45,30,110,75,0,90,60,120,45,80,150,30,60,90,120,0,75,45,90,150,60,30,45,120];
const MOCK_30: DayData[] = MOCK_30_RAW.map((m, i) => ({
  label: ['월','화','수','목','금','토','일'][i % 7],
  minutes: m,
}));

const TODAY_MINUTES = MOCK_7[MOCK_7.length - 1].minutes;
const WEEK_MINUTES = MOCK_7.reduce((s, d) => s + d.minutes, 0);
const MONTH_MINUTES = MOCK_30_RAW.reduce((s, m) => s + m, 0);

const LEFT_PAD = 32;
const RIGHT_PAD = 8;
const TOP_PAD = 12;
const CHART_H = 110;
const SVG_W = 320;
const SVG_H = 160;

type Period = '7일' | '30일';

const StudyBarChart: React.FC = () => {
  const [period, setPeriod] = useState<Period>('7일');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handlePeriodChange = (p: Period) => {
    setMounted(false);
    setPeriod(p);
    setTimeout(() => setMounted(true), 80);
  };

  const data = period === '7일' ? MOCK_7 : MOCK_30;
  const count = data.length;
  const availW = SVG_W - LEFT_PAD - RIGHT_PAD;
  const slotW = availW / count;
  const barW = period === '7일' ? Math.min(24, slotW * 0.6) : Math.min(7, slotW * 0.75);
  const maxMin = Math.max(...data.map((d) => d.minutes), 1);
  const barBase = TOP_PAD + CHART_H;

  const yLabels = [
    { value: maxMin, y: TOP_PAD + 4 },
    { value: Math.round(maxMin / 2), y: TOP_PAD + CHART_H / 2 + 4 },
    { value: 0, y: barBase + 2 },
  ];

  return (
    <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
      {/* Title + toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>공부 시간</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['7일', '30일'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              style={{
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 12,
                cursor: 'pointer',
                border: 'none',
                background: period === p ? '#C9A84C' : 'rgba(255,255,255,0.06)',
                color: period === p ? '#000' : 'rgba(255,255,255,0.5)',
                fontWeight: period === p ? 700 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
        {/* Horizontal guide lines */}
        {[0, 0.5, 1].map((pct, i) => (
          <line
            key={i}
            x1={LEFT_PAD}
            x2={SVG_W - RIGHT_PAD}
            y1={TOP_PAD + CHART_H * (1 - pct)}
            y2={TOP_PAD + CHART_H * (1 - pct)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map(({ value, y }) => (
          <text
            key={value}
            x={LEFT_PAD - 4}
            y={y}
            fontSize={10}
            fill="rgba(255,255,255,0.35)"
            textAnchor="end"
          >
            {value > 0 ? `${value}분` : '0'}
          </text>
        ))}

        {/* Bars */}
        {data.map((d, idx) => {
          const slotCenter = LEFT_PAD + idx * slotW + slotW / 2;
          const barX = slotCenter - barW / 2;
          const barH = Math.max(2, (d.minutes / maxMin) * CHART_H);
          const isToday = idx === data.length - 1;
          const hasData = d.minutes > 0;

          return (
            <g key={idx}>
              {/* Background track */}
              <rect
                x={barX}
                y={TOP_PAD}
                width={barW}
                height={CHART_H}
                rx={3}
                fill="rgba(255,255,255,0.04)"
              />

              {/* Data bar */}
              {hasData && (
                <rect
                  x={barX}
                  y={barBase - barH}
                  width={barW}
                  height={barH}
                  rx={3}
                  fill={isToday ? '#E8C96A' : '#C9A84C'}
                  stroke={isToday ? '#C9A84C' : 'none'}
                  strokeWidth={isToday ? 1.5 : 0}
                  style={{
                    transformBox: 'fill-box' as React.CSSProperties['transformBox'],
                    transformOrigin: '50% 100%',
                    transform: mounted ? 'scaleY(1)' : 'scaleY(0)',
                    transition: `transform 0.6s ease-out ${idx * 0.02}s`,
                  }}
                />
              )}

              {/* Day label (7-day only) */}
              {period === '7일' && (
                <text
                  x={slotCenter}
                  y={barBase + 18}
                  fontSize={11}
                  fill={isToday ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)'}
                  textAnchor="middle"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Summary row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {[
          { label: '오늘', value: `${TODAY_MINUTES}분` },
          { label: '이번주', value: `${WEEK_MINUTES}분` },
          { label: '이번달', value: `${MONTH_MINUTES}분` },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{stat.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyBarChart;
