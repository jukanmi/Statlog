import { useUserStore } from '@/store/useUserStore';
import type { AIStats } from '@/types';

type StatKey = keyof AIStats;

const STAT_KEYS: StatKey[] = ['HUM', 'SOC', 'NAT', 'COL', 'PER', 'ART', 'EXP'];
// 7축, 위쪽(top)에서 시작
const ANGLES = [-90, -38.57, 12.86, 64.29, 115.71, 167.14, 218.57];
const CENTER = 130;
const CHART_RADIUS = 80;
const LABEL_RADIUS = 104;
const SVG_SIZE = 260;

const toRad = (deg: number) => (deg * Math.PI) / 180;

const getPoint = (angle: number, radius: number) => ({
  x: CENTER + radius * Math.cos(toRad(angle)),
  y: CENTER + radius * Math.sin(toRad(angle)),
});

const toPoints = (pts: { x: number; y: number }[]) =>
  pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

const getTextAnchor = (angle: number): 'middle' | 'start' | 'end' => {
  const cos = Math.cos(toRad(angle));
  if (Math.abs(cos) < 0.2) return 'middle';
  return cos > 0 ? 'start' : 'end';
};

const getLabelDy = (angle: number): number => {
  const sin = Math.sin(toRad(angle));
  if (sin < -0.5) return -8;
  if (sin > 0.5) return 16;
  return 4;
};

const STAT_LABELS: Record<StatKey, string> = {
  HUM: '인문학',
  SOC: '사회과학',
  NAT: '자연과학',
  COL: '협동력',
  PER: '끈기',
  ART: '예체능',
  EXP: '실행경험',
};

const StatRadarChart: React.FC = () => {
  const { user } = useUserStore();
  const { aiStats } = user;

  const totalPts = STAT_KEYS.reduce((sum, key) => sum + (aiStats[key] || 0), 0);

  const dataPoints = STAT_KEYS.map((key, i) =>
    getPoint(ANGLES[i], ((aiStats[key] || 0) / 100) * CHART_RADIUS)
  );

  const gridRings = [0.33, 0.66, 1.0];

  return (
    <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
      {/* Title row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>AI 분석 스탯</span>
        <span style={{
          background: 'rgba(201,168,76,0.1)',
          color: '#C9A84C',
          borderRadius: 20,
          padding: '3px 10px',
          fontSize: 12,
          fontWeight: 600,
        }}>
          {totalPts}% total
        </span>
      </div>

      <div className="flex justify-center mt-2">
        <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="drop-shadow-2xl">
          {/* Background rings */}
          {gridRings.map((pct, i) => {
            const pts = ANGLES.map((a) => getPoint(a, CHART_RADIUS * pct));
            return (
              <polygon key={i} points={toPoints(pts)}
                className="stroke-foreground/10 fill-none" strokeWidth={1} />
            );
          })}

          {/* Axis lines */}
          {ANGLES.map((angle, i) => {
            const tip = getPoint(angle, CHART_RADIUS);
            return (
              <line key={i} x1={CENTER} y1={CENTER}
                x2={tip.x.toFixed(2)} y2={tip.y.toFixed(2)}
                className="stroke-foreground/10" strokeWidth={1} />
            );
          })}

          {/* Data polygon */}
          <polygon points={toPoints(dataPoints)}
            className="fill-[#C9A84C]/20 stroke-[#C9A84C]"
            strokeWidth={2.5} strokeLinejoin="round" />

          {/* Vertex dots */}
          {dataPoints.map((pt, i) => (
            <circle key={i} cx={pt.x.toFixed(2)} cy={pt.y.toFixed(2)} r={4} className="fill-[#C9A84C] shadow-lg" />
          ))}

          {/* Axis labels */}
          {STAT_KEYS.map((key, i) => {
            const labelPt = getPoint(ANGLES[i], LABEL_RADIUS);
            const anchor = getTextAnchor(ANGLES[i]);
            const dy = getLabelDy(ANGLES[i]);
            return (
              <text
                key={key}
                x={labelPt.x.toFixed(2)}
                y={labelPt.y.toFixed(2)}
                fontSize={10}
                fill="rgba(255,255,255,0.5)"
              >
                <tspan
                  x={labelPt.x.toFixed(2)}
                  dy={dy}
                  textAnchor={anchor}
                >
                  {key}
                </tspan>
                <tspan
                  x={labelPt.x.toFixed(2)}
                  dy={12}
                  textAnchor={anchor}
                  fill="rgba(255,255,255,0.8)"
                >
                  {aiStats[key] || 0}%
                </tspan>
                <tspan
                  x={labelPt.x.toFixed(2)}
                  dy={11}
                  textAnchor={anchor}
                  fontSize={8}
                  fill="rgba(255,255,255,0.3)"
                >
                  {STAT_LABELS[key]}
                </tspan>
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default StatRadarChart;
