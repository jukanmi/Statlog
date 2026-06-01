import { useEffect, useRef, useState } from 'react';
import { useStudyStore } from '@/store/useStudyStore';
import { useQuestStore } from '@/store/useQuestStore';
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import { useUserStore } from '@/store/useUserStore';
import { ALL_CHARACTERS } from '@/constants/characters';
import { useStudyFlow } from './useStudyFlow';
import { useHomeModals } from './useHomeModals';

const BURNOUT_THRESHOLD_MINUTES = 180;

export const useHomePage = () => {
  const todayMinutes = useStudyStore((s) => s.todayMinutes);
  const currentSubject = useStudyStore((s) => s.currentSubject);
  const currentContent = useStudyStore((s) => s.currentContent);
  const streakBonusPending = useStudyStore((s) => s.streakBonusPending);
  const checkQuestReset = useQuestStore((s) => s.checkQuestReset);
  
  const { modals, actions } = useHomeModals();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const burnoutShownRef = useRef(false);

  const timer = usePomodoroTimer();
  const flow = useStudyFlow(currentSubject, currentContent);

  useEffect(() => {
    checkQuestReset();
  }, [checkQuestReset]);

  useEffect(() => {
    if (!burnoutShownRef.current && todayMinutes >= BURNOUT_THRESHOLD_MINUTES) {
      burnoutShownRef.current = true;
      actions.openBurnout();
    }
  }, [todayMinutes, actions]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleModalSave = () => {
    const elapsed = timer.timerMode === 'pomodoro' ? timer.totalStudiedSeconds : timer.elapsedSeconds;
    actions.closeStudy();
    
    if (timer.timerMode === 'pomodoro') {
      timer.handlePomodoroComplete();
    } else {
      timer.resetTimer();
    }
    flow.goToQuiz(elapsed);
  };

  const handleStatDone = () => {
    const durationMin = Math.floor(flow.savedElapsedSeconds / 60);
    const quizRatio = flow.quizTotalCount > 0 ? flow.quizCorrectCount / flow.quizTotalCount : 0;
    const { equippedCharacterId } = useUserStore.getState();
    const equippedChar = ALL_CHARACTERS.find((c) => c.id === equippedCharacterId);
    const subjectMatch = !equippedChar?.subject || equippedChar.subject === currentSubject;

    const result = useUserStore.getState().gainEquippedCharacterExp(durationMin, subjectMatch, quizRatio);
    if (result.toast) showToast(result.toast);

    flow.completeStatUpdate();
    if (streakBonusPending) actions.openStreakBonus();
  };

  const handlePomodoroComplete = () => {
    const saved = timer.handlePomodoroComplete();
    flow.goToQuiz(saved);
  };

  const todayFormatted = (() => {
    const h = Math.floor(todayMinutes / 60);
    const m = todayMinutes % 60;
    return h > 0 ? `${h}시간 ${String(m).padStart(2, '0')}분` : `${String(m).padStart(2, '0')}분`;
  })();

  return {
    state: {
      todayMinutes,
      todayFormatted,
      toastMsg,
      timer,
      flow,
      modals,
      currentSubject,
      currentContent,
    },
    actions: {
      ...actions,
      showToast,
      handleModalSave,
      handleStatDone,
      handlePomodoroComplete,
    }
  };
};
