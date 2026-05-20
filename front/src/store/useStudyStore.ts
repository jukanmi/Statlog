import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudySession } from '@/types';

type TimerState = 'idle' | 'studying' | 'paused';

interface StudyState {
  sessions: StudySession[];
  todayMinutes: number;
  todayDate: string | null;      // 'YYYY-MM-DD' — 마지막으로 todayMinutes를 집계한 날짜
  currentSubject: string;
  currentContent: string;
  studyStreak: number;           // consecutive study days
  streakBonusPending: boolean;   // true when a 7-day milestone is reached
  // Timer state (persists across tab switches)
  timerState: TimerState;
  startedAt: number | null;      // Date.now() when current segment started
  accumulatedSeconds: number;    // seconds banked before current segment
  addSession: (session: StudySession) => void;
  clearSessions: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  checkDayReset: () => void;
  clearStreakBonus: () => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set) => ({
      sessions: [],
      todayMinutes: 0,
      todayDate: null,
      currentSubject: '',
      currentContent: '',
      studyStreak: 0,
      streakBonusPending: false,
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

          return {
            sessions: [...state.sessions, session],
            todayMinutes: state.todayMinutes + session.durationMinutes,
            todayDate: sessionDate,
            currentSubject: session.subject,
            currentContent: session.content,
            studyStreak: newStreak,
            streakBonusPending: state.streakBonusPending || hitMilestone,
          };
        }),
      clearSessions: () =>
        set({ sessions: [], todayMinutes: 0, currentSubject: '', currentContent: '' }),
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
          const today = new Date().toISOString().slice(0, 10);
          if (state.todayDate !== null && state.todayDate !== today) {
            return { todayMinutes: 0, todayDate: today, timerState: 'idle', startedAt: null, accumulatedSeconds: 0 };
          }
          return {};
        }),
      clearStreakBonus: () => set({ streakBonusPending: false }),
    }),
    {
      name: 'study-store',
      // 타이머 진행 상태(startedAt)는 복원 시 리셋 — 앱 재시작 후 타이머가 이상하게 돌아가는 것 방지
      partialize: (state) => ({
        sessions: state.sessions,
        todayMinutes: state.todayMinutes,
        currentSubject: state.currentSubject,
        currentContent: state.currentContent,
        studyStreak: state.studyStreak,
        accumulatedSeconds: state.accumulatedSeconds,
        timerState: state.timerState === 'studying' ? 'paused' : state.timerState,
        startedAt: null,
      }),
    }
  )
);
