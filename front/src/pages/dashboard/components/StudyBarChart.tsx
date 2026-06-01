import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

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

const MOCK_7_PREV: DayData[] = [
  { label: '월', minutes: 90 },
  { label: '화', minutes: 60 },
  { label: '수', minutes: 30 },
  { label: '목', minutes: 120 },
  { label: '금', minutes: 80 },
  { label: '토', minutes: 45 },
  { label: '일', minutes: 20 },
];

const MOCK_30_RAW = [90,60,120,0,80,150,45,30,110,75,0,90,60,120,45,80,150,30,60,90,120,0,75,45,90,150,60,30,45,120];
const MOCK_30_PREV_RAW = [70,50,100,20,60,120,30,40,90,60,10,70,50,100,30,60,120,20,50,80,100,10,60,30,70,120,50,20,30,90];
const MOCK_30: DayData[] = MOCK_30_RAW.map((m, i) => ({
  label: ['월','화','수','목','금','토','일'][i % 7],
  minutes: m,
}));

const TODAY_MINUTES = MOCK_7[MOCK_7.length - 1].minutes;
const WEEK_MINUTES = MOCK_7.reduce((s, d) => s + d.minutes, 0);
const MONTH_MINUTES = MOCK_30_RAW.reduce((s, m) => s + m, 0);

const PREV_WEEK_MINUTES = MOCK_7_PREV.reduce((s, d) => s + d.minutes, 0);
const PREV_MONTH_MINUTES = MOCK_30_PREV_RAW.reduce((s, m) => s + m, 0);

function calcGrowth(current: number, prev: number): number {
  if (prev === 0) return 0;
  return Math.round(((current - prev) / prev) * 100);
}

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

  const currentTotal = period === '7일' ? WEEK_MINUTES : MONTH_MINUTES;
  const prevTotal = period === '7일' ? PREV_WEEK_MINUTES : PREV_MONTH_MINUTES;
  const growth = calcGrowth(currentTotal, prevTotal);

  const yLabels = [
    { value: maxMin, y: TOP_PAD + 4 },
    { value: Math.round(maxMin / 2), y: TOP_PAD + CHART_H / 2 + 4 },
    { value: 0, y: barBase + 2 },
  ];

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-lg">
      {/* Title + toggle */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-foreground text-base font-bold">공부 시간</span>
        <div className="flex gap-1.5 bg-foreground/5 rounded-full p-1">
          {(['7일', '30일'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold border-none cursor-pointer transition-all duration-200",
                period === p 
                  ? "bg-[#C9A84C] text-background" 
                  : "bg-transparent text-foreground/40 hover:text-foreground/60"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div className="mb-4">
        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="overflow-visible">
          {/* Horizontal guide lines */}
          {[0, 0.5, 1].map((pct, i) => (
            <line
              key={i}
              x1={LEFT_PAD}
              x2={SVG_W - RIGHT_PAD}
              y1={TOP_PAD + CHART_H * (1 - pct)}
              y2={TOP_PAD + CHART_H * (1 - pct)}
              className="stroke-foreground/5"
              strokeWidth={1}
            />
          ))}

          {/* Y-axis labels */}
          {yLabels.map(({ value, y }) => (
            <text
              key={value}
              x={LEFT_PAD - 4}
              y={y}
              className="fill-foreground/30 text-[10px] select-none"
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
                  rx={barW / 2}
                  className="fill-foreground/[0.03]"
                />

                {/* Data bar */}
                {hasData && (
                  <rect
                    x={barX}
                    y={barBase - barH}
                    width={barW}
                    height={barH}
                    rx={barW / 2}
                    className={cn(
                      "transition-transform duration-700 ease-out origin-bottom",
                      isToday ? "fill-[#E8C96A] stroke-[#C9A84C]" : "fill-[#C9A84C]"
                    )}
                    strokeWidth={isToday ? 1 : 0}
                    style={{
                      transformBox: 'fill-box' as React.CSSProperties['transformBox'],
                      transform: mounted ? 'scaleY(1)' : 'scaleY(0)',
                      transitionDelay: `${idx * (period === '7일' ? 30 : 5)}ms`,
                    }}
                  />
                )}

                {/* Day label (7-day only) */}
                {period === '7일' && (
                  <text
                    x={slotCenter}
                    y={barBase + 18}
                    className={cn(
                      "text-[10px] font-bold select-none",
                      isToday ? "fill-foreground/80" : "fill-foreground/20"
                    )}
                    textAnchor="middle"
                  >
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[
          { label: '오늘', value: `${TODAY_MINUTES}분` },
          { label: '이번주', value: `${WEEK_MINUTES}분` },
          { label: '이번달', value: `${MONTH_MINUTES}분` },
        ].map((stat) => (
          <div key={stat.label} className="bg-foreground/5 rounded-xl p-2.5 text-center border border-border">
            <div className="text-foreground text-sm font-black">{stat.value}</div>
            <div className="text-foreground/30 text-[10px] font-bold mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 성장률 */}
      <div className={cn(
        "mt-4 flex items-center justify-between rounded-xl px-4 py-3 border transition-all duration-300",
        growth >= 0 
          ? "bg-green-500/5 border-green-500/20" 
          : "bg-red-500/5 border-red-500/20"
      )}>
        <span className="text-foreground/50 text-[12px] font-medium">
          {period === '7일' ? '지난 주 대비' : '지난 달 대비'} 성장률
        </span>
        <span className={cn(
          "text-base font-black tracking-tight",
          growth >= 0 ? "text-[#4ADE80]" : "text-[#EF4444]"
        )}>
          {growth >= 0 ? `+${growth}%` : `${growth}%`}
        </span>
      </div>
    </div>
  );
};

export default StudyBarChart;
