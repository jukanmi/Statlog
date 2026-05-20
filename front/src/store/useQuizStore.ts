import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserQuiz, QuizType } from '@/types';

const REPORT_HIDE_THRESHOLD = 3;  // 신고 3회 이상 → 자동 숨김
const OFFICIAL_UPVOTE_THRESHOLD = 5;  // 좋아요 5회 이상 → 공식 문제로 편입

type NewQuiz = Omit<UserQuiz, 'id' | 'createdAt'>;

interface QuizStoreState {
  userQuizzes: UserQuiz[];
  upvotes: Record<string, number>;       // quizId → 좋아요 수
  downvotes: Record<string, number>;     // quizId → 싫어요 수
  reportCounts: Record<string, number>;  // quizId → 신고 수
  userVotes: Record<string, 'up' | 'down'>;  // quizId → 내가 한 투표
  reportedByMe: string[];                // 내가 신고한 quizId 목록
  officialIds: string[];                 // 공식 문제로 편입된 quizId 목록
  addQuiz: (quiz: NewQuiz) => void;
  deleteQuiz: (id: string) => void;
  voteQuiz: (id: string, type: 'up' | 'down') => void;
  reportQuiz: (id: string) => void;
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
              id: `uq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      deleteQuiz: (id) =>
        set((state) => ({
          userQuizzes: state.userQuizzes.filter((q) => q.id !== id),
        })),
      voteQuiz: (id, type) =>
        set((state) => {
          const prevVote = state.userVotes[id];
          if (prevVote === type) return {}; // 이미 같은 투표 → 무시

          const newUpvotes = { ...state.upvotes };
          const newDownvotes = { ...state.downvotes };

          // 이전 투표 취소
          if (prevVote === 'up') newUpvotes[id] = Math.max(0, (newUpvotes[id] ?? 0) - 1);
          if (prevVote === 'down') newDownvotes[id] = Math.max(0, (newDownvotes[id] ?? 0) - 1);

          // 새 투표 추가
          if (type === 'up') newUpvotes[id] = (newUpvotes[id] ?? 0) + 1;
          if (type === 'down') newDownvotes[id] = (newDownvotes[id] ?? 0) + 1;

          // 공식 문제 편입 여부 확인
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
        }),
      reportQuiz: (id) =>
        set((state) => {
          if (state.reportedByMe.includes(id)) return {}; // 이미 신고함
          const newCount = (state.reportCounts[id] ?? 0) + 1;
          return {
            reportCounts: { ...state.reportCounts, [id]: newCount },
            reportedByMe: [...state.reportedByMe, id],
          };
        }),
      isHidden: (id) => (get().reportCounts[id] ?? 0) >= REPORT_HIDE_THRESHOLD,
      isOfficial: (id) => get().officialIds.includes(id),
    }),
    { name: 'quiz-store' }
  )
);

export { OFFICIAL_UPVOTE_THRESHOLD, REPORT_HIDE_THRESHOLD };
// QuizType re-export for convenience
export type { QuizType };
