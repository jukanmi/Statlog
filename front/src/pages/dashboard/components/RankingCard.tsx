import { useUserStore } from '@/store/useUserStore';
import type { Stats } from '@/types';

interface CategoryRank {
  category: string;
  icon: string;
  statKey: keyof Stats;
  totalUsers: number;
}

const CATEGORIES: CategoryRank[] = [
  { category: '개발자', icon: '💻', statKey: 'NAT', totalUsers: 12400 },
  { category: '마케터', icon: '📢', statKey: 'SOC', totalUsers: 5800 },
  { category: '디자이너', icon: '🎨', statKey: 'ART', totalUsers: 3200 },
  { category: '체력관리', icon: '🏋️', statKey: 'ART', totalUsers: 8900 },
  { category: '자격증', icon: '📜', statKey: 'PER', totalUsers: 21000 },
];

function calcTopPercent(stat: number, totalUsers: number): number {
  // stat 0~100 기준으로 상위 % 계산 (mock 알고리즘)
  const rank = Math.max(1, Math.round(totalUsers * (1 - stat / 100)));
  return Math.max(1, Math.round((rank / totalUsers) * 100));
}

const RankingCard: React.FC = () => {
  const { user } = useUserStore();
  const { stats } = user;

  return (
    <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>직업군 랭킹</span>
        <span style={{
          background: 'rgba(167,139,250,0.1)', color: '#A78BFA',
          borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
        }}>
          상위 N%
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CATEGORIES.map((cat) => {
          const stat = stats[cat.statKey] ?? 0;
          const topPct = calcTopPercent(stat, cat.totalUsers);
          const isTop10 = topPct <= 10;
          const isTop30 = topPct <= 30;

          return (
            <div
              key={cat.category}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#0F0F1A', borderRadius: 12,
                border: isTop10
                  ? '1px solid rgba(201,168,76,0.25)'
                  : '1px solid rgba(255,255,255,0.06)',
                padding: '12px 14px',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: isTop10
                  ? 'rgba(201,168,76,0.1)'
                  : 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {cat.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{cat.category}</span>
                  {isTop10 && (
                    <span style={{
                      background: 'rgba(201,168,76,0.15)', color: '#C9A84C',
                      borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700,
                    }}>TOP 10%</span>
                  )}
                </div>
                {/* Progress bar */}
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${stat}%`,
                    background: isTop10
                      ? 'linear-gradient(90deg, #C9A84C, #E8CC7A)'
                      : isTop30
                      ? '#A78BFA'
                      : '#60A5FA',
                    borderRadius: 2,
                    transition: 'width 600ms ease-out',
                  }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  color: isTop10 ? '#C9A84C' : isTop30 ? '#A78BFA' : '#fff',
                  fontSize: 15, fontWeight: 700,
                }}>
                  상위 {topPct}%
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 1 }}>
                  {cat.statKey} {stat}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 12, color: 'rgba(255,255,255,0.25)',
        fontSize: 11, textAlign: 'center',
      }}>
        스탯을 올릴수록 랭킹이 올라가요
      </div>
    </div>
  );
};

export default RankingCard;
