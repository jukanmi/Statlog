import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useUserStore } from './useUserStore';

interface QuestState {
  dailyStudyGoalMinutes: number;
  dailyStudyGoalSubject: string;
  dailyQuestStatus: Record<string, { isClaimed: boolean }>;
  lastQuestDate: string | null;
  updateDailyStudyGoal: (minutes: number, subject?: string) => void;
  claimDailyQuest: (questId: string, reward: { gold: number; gems: number }) => void;
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
      claimDailyQuest: (questId, reward) => {
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
          userStore.updateCurrency(userStore.user.gold + reward.gold, userStore.user.gems + reward.gems);
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
