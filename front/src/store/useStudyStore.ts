import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudySession, AIStats, AIQuizItem } from '@/types';


type TimerState = 'idle' | 'studying' | 'paused';

function getMondayStr(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

interface StudyState {
  sessions: StudySession[];
  todayMinutes: number;
  todayDate: string | null;      // 'YYYY-MM-DD'
  weeklyMinutes: number;         // 이번 주(월요일 기준) 누적 학습 분수
  weeklyDate: string | null;     // 마지막 세션 날짜 (주 초기화 기준)
  currentSubject: string;
  currentContent: string;
  studyStreak: number;
  streakBonusPending: boolean;
  // AI results from the last finished session
  lastSessionStats: AIStats | null;
  lastSessionQuiz: AIQuizItem[] | null;
  // Timer state (persists across tab switches)
  timerState: TimerState;
  startedAt: number | null;
  accumulatedSeconds: number;
  addSession: (session: StudySession) => void;
  clearSessions: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  checkDayReset: () => void;
  clearStreakBonus: () => void;
  setLastSessionStats: (stats: AIStats | null) => void;
  setLastSessionQuiz: (quiz: AIQuizItem[] | null) => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set) => ({
      sessions: [],
      todayMinutes: 0,
      todayDate: null,
      weeklyMinutes: 0,
      weeklyDate: null,
      currentSubject: '',
      currentContent: '',
      studyStreak: 0,
      streakBonusPending: false,
      lastSessionStats: null,
      lastSessionQuiz: null,
      timerState: 'idle',
      startedAt: null,
      accumulatedSeconds: 0,
      addSession: (session) =>
        set((state) => {
          const prevDate = state.todayDate;
          const sessionDate = session.date;
          let newStreak = state.studyStreak;

          if (prevDate === null) {
            newStreak = 1;
          } else if (prevDate !== sessionDate) {
            const prev = new Date(prevDate);
            const curr = new Date(sessionDate);
            const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
            newStreak = diffDays === 1 ? state.studyStreak + 1 : 1;
          }

          const hitMilestone = newStreak > 0 && newStreak % 7 === 0 && newStreak !== state.studyStreak;

          // 주간 공부시간 — 월요일 기준으로 매주 초기화
          const sessionMonday = getMondayStr(sessionDate);
          const prevMonday = state.weeklyDate ? getMondayStr(state.weeklyDate) : null;
          const isNewWeek = prevMonday !== sessionMonday;

          return {
            sessions: [...state.sessions, session],
            todayMinutes: state.todayMinutes + session.durationMinutes,
            todayDate: sessionDate,
            weeklyMinutes: isNewWeek
              ? session.durationMinutes
              : state.weeklyMinutes + session.durationMinutes,
            weeklyDate: sessionDate,
            currentSubject: session.subject,
            currentContent: session.content,
            studyStreak: newStreak,
            streakBonusPending: state.streakBonusPending || hitMilestone,
          };
        }),
      clearSessions: () =>
        set({ sessions: [], todayMinutes: 0, currentSubject: '', currentContent: '', lastSessionStats: null, lastSessionQuiz: null }),
      startTimer: () =>
        set((state) => ({
          timerState: 'studying',
          startedAt: Date.now() - state.accumulatedSeconds * 1000,
        })),
      pauseTimer: () =>
        set((state) => ({
          timerState: 'paused',
          accumulatedSeconds: state.startedAt
            ? Math.floor((Date.now() - state.startedAt) / 1000)
            : state.accumulatedSeconds,
          startedAt: null,
        })),
      stopTimer: () =>
        set((state) => ({
          timerState: 'paused',
          accumulatedSeconds: state.startedAt
            ? Math.floor((Date.now() - state.startedAt) / 1000)
            : state.accumulatedSeconds,
          startedAt: null,
        })),
      resetTimer: () =>
        set({ timerState: 'idle', startedAt: null, accumulatedSeconds: 0 }),
      checkDayReset: () =>
        set((state) => {
          const today = new Date().toLocaleDateString('sv-SE');
          if (state.todayDate !== null && state.todayDate !== today) {
            return { todayMinutes: 0, todayDate: today, timerState: 'idle', startedAt: null, accumulatedSeconds: 0 };
          }
          return {};
        }),
      clearStreakBonus: () => set({ streakBonusPending: false }),
      setLastSessionStats: (stats) => set({ lastSessionStats: stats }),
      setLastSessionQuiz: (quiz) => set({ lastSessionQuiz: quiz }),
    }),
    {
      name: 'study-store',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as StudyState;
        if (version < 2) {
          state.weeklyMinutes = state.weeklyMinutes ?? 0;
          state.weeklyDate = state.weeklyDate ?? null;
          state.studyStreak = state.studyStreak ?? 0;
          state.streakBonusPending = state.streakBonusPending ?? false;
        }
        return state;
      },
      partialize: (state) => ({
        sessions: state.sessions,
        todayMinutes: state.todayMinutes,
        todayDate: state.todayDate,
        weeklyMinutes: state.weeklyMinutes,
        weeklyDate: state.weeklyDate,
        currentSubject: state.currentSubject,
        currentContent: state.currentContent,
        studyStreak: state.studyStreak,
        lastSessionStats: state.lastSessionStats,
        lastSessionQuiz: state.lastSessionQuiz,
        accumulatedSeconds: state.timerState === 'studying' && state.startedAt
          ? Math.floor((Date.now() - state.startedAt) / 1000)
          : state.accumulatedSeconds,
        timerState: state.timerState === 'studying' ? 'paused' : state.timerState,
        startedAt: null,
      }),
    }
  )
);
