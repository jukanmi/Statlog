import React, { useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useRankingStore } from '@/store/useRankingStore'; // 🏆 신설된 랭킹 전역 스토어 연동 import
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

  // 📡 [최종 조립] 원격 실시간 데이터 갱신을 위한 랭킹 바인딩 훅 이식
  const { rankingsByCategory, loadRankings, isLoading } = useRankingStore();

  useEffect(() => {
    // 컴포넌트 구동 시 정의된 카테고리별 상위 N% 랭킹 분석 API 실시간 병렬 호출
    CATEGORIES.forEach((cat) => {
      loadRankings(cat.statKey).catch((err) =>
        console.warn(`${cat.category} 원격 데이터 동기화 대기:`, err)
      );
    });
  }, [loadRankings]);

  return (
    <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>직업군 실시간 랭킹</span>
        <span style={{
          background: 'rgba(167,139,250,0.1)', color: '#A78BFA',
          borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
        }}>
          {isLoading ? '서버 통신 중...' : '상위 N%'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CATEGORIES.map((cat) => {
          const stat = stats[cat.statKey] ?? 0;

          // 전역 스토어 캐시풀에서 해당 카테고리의 랭킹 목록 스냅샷 조회
          const serverRankList = rankingsByCategory[cat.statKey];
          // 실시간 응답 리스트 내부에서 내 아이디와 일치하는 실시간 랭크 지표 매핑 검색
          const myLiveRankData = serverRankList?.find((item) => item.userId === user.id);

          // 🎯 원격지 분석 서버 실시간 데이터 지표 최우선 배치 -> 예외 시 클라이언트 수식 가산 가상 전환
          const topPct = myLiveRankData ? myLiveRankData.percentage : calcTopPercent(stat, cat.totalUsers);

          const isTop10 = topPct <= 10;
          const isTop30 = topPct <= 30;

          return (
            <div
              key={cat.category}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#0F0F1A', borderRadius: 12, padding: 14,
                border: isTop10 ? '1px solid rgba(201,168,76,0.25)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                background: isTop10 ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.05)',
              }}>
                {cat.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{cat.category}</span>
                  {isTop10 && (
                    <span style={{
                      background: 'rgba(201,168,76,0.15)', color: '#C9A84C',
                      borderRadius: 20, padding: '1px 6px', fontSize: 8, fontWeight: 900, letterSpacing: '-0.5px',
                    }}>TOP 10%</span>
                  )}
                </div>
                {/* Progress bar */}
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, stat)}%`,
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
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 4 }}>
                <div style={{
                  fontSize: 14, fontWeight: 900, letterSpacing: '-0.5px',
                  color: isTop10 ? '#C9A84C' : isTop30 ? '#A78BFA' : 'rgba(255,255,255,0.8)',
                }}>
                  상위 {topPct}%
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, marginTop: 2, textTransform: 'uppercase' }}>
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
        백엔드 API 분석 시스템 연동 완료 • 매 학습 완료 정산 시 순위가 실시간 갱신됩니다.
      </div>
    </div>
  );
};

export default RankingCard;
