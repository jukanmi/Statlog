import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserQuiz, QuizType } from '@/types';
import { voteQuizOnServer, reportQuizOnServer } from '@/lib/api';

const REPORT_HIDE_THRESHOLD = 3;
const OFFICIAL_UPVOTE_THRESHOLD = 5;

type NewQuiz = Omit<UserQuiz, 'id' | 'createdAt'> & { id?: string };

interface QuizStoreState {
  userQuizzes: UserQuiz[];
  upvotes: Record<string, number>;
  downvotes: Record<string, number>;
  reportCounts: Record<string, number>;
  userVotes: Record<string, 'up' | 'down'>;
  reportedByMe: string[];
  officialIds: string[];
  addQuiz: (quiz: NewQuiz) => void;
  deleteQuiz: (id: string) => void;
  voteQuiz: (id: string, type: 'up' | 'down') => Promise<void>;
  reportQuiz: (id: string) => Promise<void>;
  isHidden: (id: string) => boolean;
  isOfficial: (id: string) => boolean;
}

export const useQuizStore = create<QuizStoreState>()(
  persist(
    (set, get) => ({
      userQuizzes: [],
      upvotes: {},
      downvotes: {},
      reportCounts: {},
      userVotes: {},
      reportedByMe: [],
      officialIds: [],
      addQuiz: (quiz) =>
        set((state) => ({
          userQuizzes: [
            ...state.userQuizzes,
            {
              ...quiz,
              id: quiz.id ?? `uq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      deleteQuiz: (id) =>
        set((state) => ({
          userQuizzes: state.userQuizzes.filter((q) => q.id !== id),
        })),
      voteQuiz: async (id, type) => {
        const prevVote = get().userVotes[id];
        if (prevVote === type) return;

        try {
          await voteQuizOnServer(id, type);
          set((state) => {
            const newUpvotes = { ...state.upvotes };
            const newDownvotes = { ...state.downvotes };

            if (prevVote === 'up') newUpvotes[id] = Math.max(0, (newUpvotes[id] ?? 0) - 1);
            if (prevVote === 'down') newDownvotes[id] = Math.max(0, (newDownvotes[id] ?? 0) - 1);

            if (type === 'up') newUpvotes[id] = (newUpvotes[id] ?? 0) + 1;
            if (type === 'down') newDownvotes[id] = (newDownvotes[id] ?? 0) + 1;

            const newOfficialIds = [...state.officialIds];
            if (type === 'up' && (newUpvotes[id] ?? 0) >= OFFICIAL_UPVOTE_THRESHOLD) {
              if (!newOfficialIds.includes(id)) newOfficialIds.push(id);
            }

            return {
              upvotes: newUpvotes,
              downvotes: newDownvotes,
              userVotes: { ...state.userVotes, [id]: type },
              officialIds: newOfficialIds,
            };
          });
        } catch (e) { console.error(e); }
      },
      reportQuiz: async (id) => {
        if (get().reportedByMe.includes(id)) return;
        try {
          await reportQuizOnServer(id);
          set((state) => {
            const newCount = (state.reportCounts[id] ?? 0) + 1;
            return {
              reportCounts: { ...state.reportCounts, [id]: newCount },
              reportedByMe: [...state.reportedByMe, id],
            };
          });
        } catch (e) { console.error(e); }
      },
      isHidden: (id) => (get().reportCounts[id] ?? 0) >= REPORT_HIDE_THRESHOLD,
      isOfficial: (id) => get().officialIds.includes(id),
    }),
    { name: 'quiz-store' }
  )
);

export { OFFICIAL_UPVOTE_THRESHOLD, REPORT_HIDE_THRESHOLD };
export type { QuizType };