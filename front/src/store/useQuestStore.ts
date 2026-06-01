import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useUserStore } from './useUserStore';
import { syncUserToServer } from '@/lib/api'; // 📡 서버 동기화 API 유틸 추가

interface QuestState {
  dailyStudyGoalMinutes: number;
  dailyStudyGoalSubject: string;
  dailyQuestStatus: Record<string, { isClaimed: boolean }>;
  lastQuestDate: string | null;
  updateDailyStudyGoal: (minutes: number, subject?: string) => void;
  claimDailyQuest: (questId: string, reward: { gold: number; gems: number }) => Promise<void>; // 비동기 액션으로 갱신
  checkQuestReset: () => void;
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set) => ({
      dailyStudyGoalMinutes: 60,
      dailyStudyGoalSubject: '자유 학습',
      dailyQuestStatus: {},
      lastQuestDate: null,
      updateDailyStudyGoal: (minutes, subject) =>
        set((state) => ({
          dailyStudyGoalMinutes: minutes,
          dailyStudyGoalSubject: subject !== undefined ? subject : state.dailyStudyGoalSubject,
        })),
      claimDailyQuest: async (questId, reward) => {
        const today = new Date().toLocaleDateString('en-CA');
        set((state) => ({
          lastQuestDate: today,
          dailyQuestStatus: {
            ...state.dailyQuestStatus,
            [questId]: { isClaimed: true },
          },
        }));
        
        if (reward) {
          const userStore = useUserStore.getState();
          const nextGold = userStore.user.gold + reward.gold;
          const nextGems = userStore.user.gems + reward.gems;
          
          // 1. 클라이언트 로컬 재화 즉시 가산 (UX 최적화)
          userStore.updateCurrency(nextGold, nextGems);
          
          // 2. 📡 [보완 완료] 새로고침 시 유실 방지를 위한 백엔드 원격 영구 저장 패치
          try {
            await syncUserToServer({
              gold: nextGold,
              gems: nextGems,
            });
          } catch (e) {
            console.error('일일 퀘스트 재화 서버 정산 동기화 실패:', e);
          }
        }
      },
      checkQuestReset: () => {
        const today = new Date().toLocaleDateString('en-CA');
        set((state) => {
          if (state.lastQuestDate !== today) {
            return { lastQuestDate: today, dailyQuestStatus: {} };
          }
          return {};
        });
      },
    }),
    { name: 'quest-store' }
  )
);