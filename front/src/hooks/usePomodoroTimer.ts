import { useState, useEffect, useCallback } from 'react';
import { useStudyTimer, getPomodoroPhaseSeconds, type PomodoroConfig } from './useStudyTimer';
import type { TimerMode } from '@/pages/home/components/TimerModeToggle';
import type { PomodoroNotice } from '@/pages/home/components/PomodoroNoticeOverlay';

export function usePomodoroTimer() {
  const [timerMode, setTimerMode] = useState<TimerMode>('normal');
  const [pomPhase, setPomPhase] = useState<PomodoroConfig['phase']>('study');
  const [pomRound, setPomRound] = useState(1);
  const [pomNotice, setPomNotice] = useState<PomodoroNotice>(null);
  const [cumulativeStudySeconds, setCumulativeStudySeconds] = useState(0);

  const pomodoroConfig: PomodoroConfig | undefined =
    timerMode === 'pomodoro' ? { phase: pomPhase, round: pomRound } : undefined;

  const {
    timerState,
    elapsedSeconds,
    formattedTime,
    progress,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
  } = useStudyTimer(pomodoroConfig);

  // --- Pomodoro phase completion detection ---
  useEffect(() => {
    if (timerMode !== 'pomodoro' || timerState !== 'studying' || pomNotice !== null) return;
    const phaseSeconds = getPomodoroPhaseSeconds({ phase: pomPhase, round: pomRound });
    if (elapsedSeconds >= phaseSeconds) {
      pauseTimer();
      if (pomPhase === 'study') {
        setCumulativeStudySeconds((prev) => prev + phaseSeconds);
        setPomNotice('study-done');
      } else {
        setPomNotice('break-done');
      }
    }
  }, [elapsedSeconds, timerState, timerMode, pomPhase, pomRound, pomNotice, pauseTimer]);

  const handleBreakStart = useCallback(() => {
    setPomNotice(null);
    setPomPhase('break');
    resetTimer();
  }, [resetTimer]);

  const handleNextRound = useCallback(() => {
    setPomNotice(null);
    setPomPhase('study');
    setPomRound((r) => Math.min(r + 1, 4));
    resetTimer();
  }, [resetTimer]);

  const handlePomodoroComplete = useCallback(() => {
    setPomNotice(null);
    const saved = cumulativeStudySeconds;
    resetTimer();
    setCumulativeStudySeconds(0);
    setPomPhase('study');
    setPomRound(1);
    return saved;
  }, [cumulativeStudySeconds, resetTimer]);

  const switchMode = useCallback((mode: TimerMode) => {
    setTimerMode(mode);
    resetTimer();
    setCumulativeStudySeconds(0);
    setPomPhase('study');
    setPomRound(1);
    setPomNotice(null);
  }, [resetTimer]);

  // Total studied seconds (for pomodoro: cumulative + current study phase only)
  const totalStudiedSeconds =
    timerMode === 'pomodoro'
      ? cumulativeStudySeconds +
        (pomPhase === 'study'
          ? Math.min(elapsedSeconds, getPomodoroPhaseSeconds({ phase: 'study', round: pomRound }))
          : 0)
      : elapsedSeconds;

  return {
    timerMode,
    pomPhase,
    pomRound,
    pomNotice,
    cumulativeStudySeconds,
    totalStudiedSeconds,
    timerState,
    elapsedSeconds,
    formattedTime,
    progress,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    handleBreakStart,
    handleNextRound,
    handlePomodoroComplete,
    switchMode,
  };
}
