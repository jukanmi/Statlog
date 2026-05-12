import { useState, useEffect } from 'react';

interface SubjectStat {
  subject: string;
  minutes: number;
  color: string;
}

const SUBJECT_STATS: SubjectStat[] = [
  { subject: '프로그래밍', minutes: 340, color: '#7C3AED' },
  { subject: '수학',       minutes: 220, color: '#C9A84C' },
  { subject: '영어',       minutes: 150, color: '#3B82F6' },
  { subject: '과학',       minutes: 90,  color: '#4ADE80' },
  { subject: '기타',       minutes: 40,  color: '#9CA3AF' },
];

const TOTAL = SUBJECT_STATS.reduce((s, d) => s + d.minutes, 0);

const SubjectStats: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
      <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        공부 분야
      </div>

      {SUBJECT_STATS.map((stat, idx) => {
        const pct = Math.round((stat.minutes / TOTAL) * 100);
        return (
          <div
            key={stat.subject}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: idx < SUBJECT_STATS.length - 1 ? 12 : 0,
            }}
          >
            <span style={{
              color: '#fff',
              fontSize: 13,
              minWidth: 64,
              flexShrink: 0,
            }}>
              {stat.subject}
            </span>

            <div style={{
              flex: 1,
              height: 8,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 4,
              margin: '0 12px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                borderRadius: 4,
                background: stat.color,
                width: mounted ? `${pct}%` : '0%',
                transition: `width 0.8s ease-out ${idx * 0.1}s`,
              }} />
            </div>

            <span style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 12,
              minWidth: 36,
              textAlign: 'right',
              flexShrink: 0,
            }}>
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default SubjectStats;
