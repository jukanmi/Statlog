import { useState, useEffect } from 'react';
import { useStudyStore } from '@/store/useStudyStore';

const NORMAL_CYCLE_SECONDS = 25 * 60;

export interface PomodoroConfig {
  phase: 'study' | 'break';
  round: number; // 1-based, 1–4
}

export function getPomodoroPhaseSeconds(config: PomodoroConfig): number {
  if (config.phase === 'study') return 25 * 60;
  return config.round >= 4 ? 15 * 60 : 5 * 60;
}

export function useStudyTimer(pomodoro?: PomodoroConfig) {
  const timerState = useStudyStore((s) => s.timerState);
  const startedAt = useStudyStore((s) => s.startedAt);
  const accumulatedSeconds = useStudyStore((s) => s.accumulatedSeconds);
  const startTimer = useStudyStore((s) => s.startTimer);
  const pauseTimer = useStudyStore((s) => s.pauseTimer);
  const stopTimer = useStudyStore((s) => s.stopTimer);
  const resetTimer = useStudyStore((s) => s.resetTimer);

  // Tick state just to force re-renders every second while studying
  const [, setTick] = useState(0);

  useEffect(() => {
    if (timerState !== 'studying') return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerState]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && timerState === 'studying') {
        pauseTimer();
        alert('탭이 숨겨졌습니다. 타이머가 일시정지되었습니다.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [timerState, pauseTimer]);

  const elapsedSeconds =
    timerState === 'studying' && startedAt !== null
      ? Math.floor((Date.now() - startedAt) / 1000)
      : accumulatedSeconds;

  let formattedTime: string;
  let progress: number;

  if (pomodoro) {
    const totalSeconds = getPomodoroPhaseSeconds(pomodoro);
    const remaining = Math.max(0, totalSeconds - elapsedSeconds);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    formattedTime = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    // 1 = full (phase just started), 0 = empty (phase done)
    progress = Math.max(0, (totalSeconds - elapsedSeconds) / totalSeconds);
  } else {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    progress = NORMAL_CYCLE_SECONDS > 0
      ? (elapsedSeconds % NORMAL_CYCLE_SECONDS) / NORMAL_CYCLE_SECONDS
      : 0;
  }

  return {
    timerState,
    elapsedSeconds,
    formattedTime,
    progress,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
  };
}
