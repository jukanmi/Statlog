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
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set) => ({
      sessions: [],
      todayMinutes: 0,
      todayDate: null,
      currentSubject: '',
      currentContent: '',
      timerState: 'idle',
      startedAt: null,
      accumulatedSeconds: 0,
      addSession: (session) =>
        set((state) => ({
          sessions: [...state.sessions, session],
          todayMinutes: state.todayMinutes + session.durationMinutes,
          todayDate: session.date,
          currentSubject: session.subject,
          currentContent: session.content,
        })),
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
          const today = new Date().toLocaleDateString('sv-SE');
          if (state.todayDate !== null && state.todayDate !== today) {
            return { todayMinutes: 0, todayDate: today, timerState: 'idle', startedAt: null, accumulatedSeconds: 0 };
          }
          return {};
        }),
    }),
    {
      name: 'study-store',
      // 타이머 진행 상태(startedAt)는 복원 시 리셋 — 앱 재시작 후 타이머가 이상하게 돌아가는 것 방지
      partialize: (state) => ({
        sessions: state.sessions,
        todayMinutes: state.todayMinutes,
        currentSubject: state.currentSubject,
        currentContent: state.currentContent,
        accumulatedSeconds: state.timerState === 'studying' && state.startedAt
          ? Math.floor((Date.now() - state.startedAt) / 1000)
          : state.accumulatedSeconds,
        timerState: state.timerState === 'studying' ? 'paused' : state.timerState,
        startedAt: null,
      }),
    }
  )
);
