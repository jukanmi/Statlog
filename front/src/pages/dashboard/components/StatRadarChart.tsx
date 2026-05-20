import { useUserStore } from '@/store/useUserStore';
import type { Stats } from '@/types';

type StatKey = keyof Stats;

const STAT_KEYS: StatKey[] = ['INT', 'STR', 'END', 'AGI', 'CHA', 'COP'];
// 6축, 60° 간격, 위쪽(top)에서 시작
const ANGLES = [-90, -30, 30, 90, 150, 210];
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
  INT: '지식력',
  STR: '근력',
  END: '지구력',
  AGI: '민첩성',
  CHA: '매력',
  COP: '협력력',
};

const StatRadarChart: React.FC = () => {
  const { user } = useUserStore();
  const { stats } = user;

  const safeStat = (key: StatKey) => stats[key] ?? 0;

  const totalPts = STAT_KEYS.reduce((sum, key) => sum + safeStat(key), 0);

  const dataPoints = STAT_KEYS.map((key, i) =>
    getPoint(ANGLES[i], (safeStat(key) / 100) * CHART_RADIUS)
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
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>나의 스탯</span>
        <span style={{
          background: 'rgba(201,168,76,0.1)',
          color: '#C9A84C',
          borderRadius: 20,
          padding: '3px 10px',
          fontSize: 12,
          fontWeight: 600,
        }}>
          {totalPts} pts
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        >
          {/* Background rings */}
          {gridRings.map((pct, i) => {
            const pts = ANGLES.map((a) => getPoint(a, CHART_RADIUS * pct));
            return (
              <polygon
                key={i}
                points={toPoints(pts)}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
                fill="none"
              />
            );
          })}

          {/* Axis lines */}
          {ANGLES.map((angle, i) => {
            const tip = getPoint(angle, CHART_RADIUS);
            return (
              <line
                key={i}
                x1={CENTER}
                y1={CENTER}
                x2={tip.x.toFixed(2)}
                y2={tip.y.toFixed(2)}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
              />
            );
          })}

          {/* Data polygon fill */}
          <polygon
            points={toPoints(dataPoints)}
            fill="rgba(201,168,76,0.2)"
            stroke="#C9A84C"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Vertex dots */}
          {dataPoints.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x.toFixed(2)}
              cy={pt.y.toFixed(2)}
              r={4}
              fill="#C9A84C"
            />
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
                fontSize={11}
                fill={key === 'COP' ? 'rgba(167,139,250,0.7)' : 'rgba(255,255,255,0.5)'}
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
                  dy={13}
                  textAnchor={anchor}
                  fill={key === 'COP' ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.8)'}
                >
                  {safeStat(key)}
                </tspan>
                <tspan
                  x={labelPt.x.toFixed(2)}
                  dy={12}
                  textAnchor={anchor}
                  fontSize={9}
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
