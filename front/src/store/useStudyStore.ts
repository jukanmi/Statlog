import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StudySession, AIStats } from '@/types';
import type { Quiz } from '@/lib/api';

type TimerState = 'idle' | 'studying' | 'paused';

function getMondayStr(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

const BREAK_THRESHOLD_MS = 15 * 60 * 1000;

interface StudyState {
  sessions: StudySession[];
  todayMinutes: number;
  todayDate: string | null;
  weeklyMinutes: number;
  weeklyDate: string | null;
  currentSubject: string;
  currentContent: string;
  studyStreak: number;
  streakBonusPending: boolean;
  continuousStudyMinutes: number;
  lastSessionAt: number | null;
  burnoutShownDate: string | null;
  lastSessionStats: AIStats | null;
  lastSessionQuiz: Quiz[] | null;
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
  markBurnoutShown: () => void;
  setLastSessionStats: (stats: AIStats | null) => void;
  setLastSessionQuiz: (quiz: Quiz[] | null) => void;
  getGrowthReport: () => {
    weeklyGrowthRate: number;
    monthlyGrowthRate: number;
    thisMonthTotalMinutes: number;
  };
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      sessions: [],
      todayMinutes: 0,
      todayDate: null,
      weeklyMinutes: 0,
      weeklyDate: null,
      currentSubject: '',
      currentContent: '',
      studyStreak: 0,
      streakBonusPending: false,
      continuousStudyMinutes: 0,
      lastSessionAt: null,
      burnoutShownDate: null,
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
          const sessionMonday = getMondayStr(sessionDate);
          const prevMonday = state.weeklyDate ? getMondayStr(state.weeklyDate) : null;
          const isNewWeek = prevMonday !== sessionMonday;

          const now = Date.now();
          const hadBreak = state.lastSessionAt === null || (now - state.lastSessionAt) >= BREAK_THRESHOLD_MS;
          const newContinuous = hadBreak
            ? session.durationMinutes
            : state.continuousStudyMinutes + session.durationMinutes;

          return {
            sessions: [...state.sessions, session],
            todayMinutes: state.todayMinutes + session.durationMinutes,
            todayDate: sessionDate,
            weeklyMinutes: isNewWeek ? session.durationMinutes : state.weeklyMinutes + session.durationMinutes,
            weeklyDate: sessionDate,
            currentSubject: session.subject,
            currentContent: session.content,
            studyStreak: newStreak,
            streakBonusPending: state.streakBonusPending || hitMilestone,
            continuousStudyMinutes: newContinuous,
            lastSessionAt: now,
          };
        }),
      clearSessions: () =>
        set({ sessions: [], todayMinutes: 0, currentSubject: '', currentContent: '', lastSessionStats: null, lastSessionQuiz: null, continuousStudyMinutes: 0, lastSessionAt: null }),
      startTimer: () =>
        set((state) => ({
          timerState: 'studying',
          startedAt: Date.now() - state.accumulatedSeconds * 1000,
        })),
      pauseTimer: () =>
        set((state) => ({
          timerState: 'paused',
          accumulatedSeconds: state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : state.accumulatedSeconds,
          startedAt: null,
        })),
      stopTimer: () =>
        set((state) => ({
          timerState: 'paused',
          accumulatedSeconds: state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : state.accumulatedSeconds,
          startedAt: null,
        })),
      resetTimer: () => set({ timerState: 'idle', startedAt: null, accumulatedSeconds: 0 }),
      checkDayReset: () =>
        set((state) => {
          const today = new Date().toLocaleDateString('sv-SE');
          if (state.todayDate !== null && state.todayDate !== today) {
            return { todayMinutes: 0, todayDate: today, timerState: 'idle', startedAt: null, accumulatedSeconds: 0, continuousStudyMinutes: 0, lastSessionAt: null, burnoutShownDate: null };
          }
          return {};
        }),
      clearStreakBonus: () => set({ streakBonusPending: false }),
      markBurnoutShown: () => set({ burnoutShownDate: new Date().toLocaleDateString('sv-SE') }),
      setLastSessionStats: (stats) => set({ lastSessionStats: stats }),
      setLastSessionQuiz: (quiz) => set({ lastSessionQuiz: quiz }),
      
      getGrowthReport: () => {
        const sessions = get().sessions;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let currentWeekMin = 0, prevWeekMin = 0, currentMonthMin = 0, prevMonthMin = 0;

        sessions.forEach((s) => {
          const sDate = new Date(s.date);
          const diffTime = now.getTime() - sDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= 0 && diffDays < 7) currentWeekMin += s.durationMinutes;
          else if (diffDays >= 7 && diffDays < 14) prevWeekMin += s.durationMinutes;

          if (sDate.getFullYear() === currentYear && sDate.getMonth() === currentMonth) {
            currentMonthMin += s.durationMinutes;
          } else {
            const isLastMonth = currentMonth === 0 
              ? (sDate.getFullYear() === currentYear - 1 && sDate.getMonth() === 11)
              : (sDate.getFullYear() === currentYear && sDate.getMonth() === currentMonth - 1);
            if (isLastMonth) prevMonthMin += s.durationMinutes;
          }
        });

        const rate = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

        return {
          weeklyGrowthRate: rate(currentWeekMin, prevWeekMin),
          monthlyGrowthRate: rate(currentMonthMin, prevMonthMin),
          thisMonthTotalMinutes: currentMonthMin
        };
      }
    }),
    {
      name: 'study-store',
      version: 3,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as StudyState;
        if (version < 2) { state.weeklyMinutes = state.weeklyMinutes ?? 0; state.weeklyDate = state.weeklyDate ?? null; state.studyStreak = state.studyStreak ?? 0; state.streakBonusPending = state.streakBonusPending ?? false; }
        if (version < 3) { state.continuousStudyMinutes = state.continuousStudyMinutes ?? 0; state.lastSessionAt = state.lastSessionAt ?? null; state.burnoutShownDate = state.burnoutShownDate ?? null; }
        return state;
      },
      // 추론 락인 문제를 해결하기 위해 데이터 파트의 반환 형식을 안전하게 단언(Assertion) 처리합니다.
      partialize: (state) => ({
        sessions: state.sessions,
        todayMinutes: state.todayMinutes,
        todayDate: state.todayDate,
        weeklyMinutes: state.weeklyMinutes,
        weeklyDate: state.weeklyDate,
        currentSubject: state.currentSubject,
        currentContent: state.currentContent,
        studyStreak: state.studyStreak,
        streakBonusPending: state.streakBonusPending,
        continuousStudyMinutes: state.continuousStudyMinutes,
        lastSessionAt: state.lastSessionAt,
        burnoutShownDate: state.burnoutShownDate,
        lastSessionStats: state.lastSessionStats,
        lastSessionQuiz: state.lastSessionQuiz,
        accumulatedSeconds: state.timerState === 'studying' && state.startedAt
          ? Math.floor((Date.now() - state.startedAt) / 1000)
          : state.accumulatedSeconds,
        timerState: state.timerState === 'studying' ? 'paused' : state.timerState,
        startedAt: null,
      } as Partial<StudyState>),
    }
  )
);