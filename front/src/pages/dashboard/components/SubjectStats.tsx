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
    <div className="bg-card rounded-2xl p-5 border border-border shadow-lg">
      <div className="text-foreground text-base font-bold mb-4">
        공부 분야
      </div>

      <div className="flex flex-col gap-3">
        {SUBJECT_STATS.map((stat, idx) => {
          const pct = Math.round((stat.minutes / TOTAL) * 100);
          return (
            <div
              key={stat.subject}
              className="flex items-center"
            >
              <span className="text-foreground text-[13px] font-medium min-w-[64px] shrink-0">
                {stat.subject}
              </span>

              <div className="flex-1 h-2 bg-foreground/5 rounded-full mx-3 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-800 ease-out"
                  style={{ 
                    backgroundColor: stat.color,
                    width: mounted ? `${pct}%` : '0%',
                    transitionDelay: `${idx * 100}ms`
                  }} 
                />
              </div>

              <span className="text-foreground/40 text-[11px] font-bold min-w-[36px] text-right shrink-0 tabular-nums">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectStats;
