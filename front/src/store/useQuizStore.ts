import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserQuiz, QuizType } from '@/types';

type NewQuiz = Omit<UserQuiz, 'id' | 'createdAt'>;

interface QuizStoreState {
  userQuizzes: UserQuiz[];
  addQuiz: (quiz: NewQuiz) => void;
  deleteQuiz: (id: string) => void;
}

export const useQuizStore = create<QuizStoreState>()(
  persist(
    (set) => ({
      userQuizzes: [],
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
    }),
    { name: 'quiz-store' }
  )
);

// QuizType re-export for convenience
export type { QuizType };
