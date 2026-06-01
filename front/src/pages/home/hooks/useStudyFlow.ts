import { useState, useCallback } from 'react';
import { convertStudyToStats, type StatConversionResult } from '@/lib/api';

export type HomeScreen = 'timer' | 'quiz' | 'result' | 'stat';

export function useStudyFlow(currentSubject: string | null, currentContent: string) {
  const [screen, setScreen] = useState<HomeScreen>('timer');
  const [savedElapsedSeconds, setSavedElapsedSeconds] = useState(0);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizTotalCount, setQuizTotalCount] = useState(0);

  const [statGained, setStatGained] = useState<StatConversionResult | null>(null);
  const [statLoading, setStatLoading] = useState(false);
  const [statError, setStatError] = useState<string | null>(null);

  const fetchStatGained = useCallback(async (elapsed: number) => {
    setStatLoading(true);
    setStatError(null);
    setStatGained(null);
    try {
      const result = await convertStudyToStats({
        subject: currentSubject || '기타',
        content: currentContent,
        durationMinutes: Math.max(1, Math.round(elapsed / 60)),
        date: new Date().toLocaleDateString('en-CA'),
      });
      setStatGained(result);
    } catch (e) {
      setStatError(e instanceof Error ? e.message : '스탯 변환에 실패했어요');
    } finally {
      setStatLoading(false);
    }
  }, [currentSubject, currentContent]);

  const goToQuiz = useCallback((elapsedSeconds: number) => {
    setSavedElapsedSeconds(elapsedSeconds);
    setScreen('quiz');
  }, []);

  const completeQuiz = useCallback((correctResults: boolean[]) => {
    const correctCount = correctResults.filter(Boolean).length;
    setQuizCorrectCount(correctCount);
    setQuizTotalCount(correctResults.length);
    setScreen('result');
    void fetchStatGained(savedElapsedSeconds);
  }, [fetchStatGained, savedElapsedSeconds]);

  const skipQuiz = useCallback(() => setScreen('stat'), []);
  const continueFromResult = useCallback(() => setScreen('stat'), []);
  
  const completeStatUpdate = useCallback(() => {
    setScreen('timer');
    setStatGained(null);
    setStatError(null);
  }, []);

  return {
    screen,
    savedElapsedSeconds,
    quizCorrectCount,
    quizTotalCount,
    statGained,
    statLoading,
    statError,
    goToQuiz,
    completeQuiz,
    skipQuiz,
    continueFromResult,
    completeStatUpdate,
  };
}
