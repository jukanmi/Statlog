import { useUserStore } from '@/store/useUserStore';
import { ALL_CHARACTERS } from '@/constants/characters';
import { useQuestStore } from '@/store/useQuestStore';
import { useHomePage } from './hooks/useHomePage';
import { useStudyStore } from '@/store/useStudyStore';

import TimerScreen from './components/TimerScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import StatUpdateScreen from './components/StatUpdateScreen';
import StudyModalsContainer from './components/StudyModalsContainer';

const HomePage: React.FC = () => {
  const { state, actions } = useHomePage();
  const { timer, flow, modals, todayMinutes, todayFormatted, toastMsg, currentSubject, currentContent } = state;
  const { equippedCharacterId } = useUserStore();

  const currentCharacter = ALL_CHARACTERS.find((c) => c.id === equippedCharacterId);
  const { dailyQuestStatus, claimDailyQuest, dailyStudyGoalMinutes, dailyStudyGoalSubject } = useQuestStore();
  const lastSessionQuiz = useStudyStore((s) => s.lastSessionQuiz);

  const isStudying = timer.timerState === 'studying';
  const isPaused = timer.timerState === 'paused';
  const isActive = isStudying || isPaused;
  const isBreak = timer.timerMode === 'pomodoro' && timer.pomPhase === 'break';

  // --- Router ---
  if (flow.screen === 'quiz') {
    return (
      <QuizScreen
        subject={currentSubject || '기타'}
        content={currentContent}
        onComplete={flow.completeQuiz}
        onSkip={flow.skipQuiz}
      />
    );
  }

  if (flow.screen === 'result') {
    return (
      <ResultScreen
        correctCount={flow.quizCorrectCount}
        totalCount={lastSessionQuiz?.length || 3}
        onContinue={flow.continueFromResult}
      />
    );
  }

  if (flow.screen === 'stat') {
    return (
      <StatUpdateScreen
        subject="기타"
        elapsedSeconds={flow.savedElapsedSeconds}
        statGained={flow.statGained}
        loading={flow.statLoading}
        error={flow.statError}
        onDone={actions.handleStatDone}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center px-6 pt-[calc(48px+env(safe-area-inset-top))] pb-[calc(100px+env(safe-area-inset-bottom))] relative overflow-hidden">
      <TimerScreen
        todayMinutes={todayMinutes}
        todayFormatted={todayFormatted}
        dailyStudyGoalSubject={dailyStudyGoalSubject}
        dailyStudyGoalMinutes={dailyStudyGoalMinutes}
        dailyQuestStatus={dailyQuestStatus}
        claimDailyQuest={claimDailyQuest}
        onEditTarget={actions.openQuest}
        timerMode={timer.timerMode}
        onSwitchMode={timer.switchMode}
        pomRound={timer.pomRound}
        isBreak={isBreak}
        isActive={isActive}
        isStudying={isStudying}
        pomNotice={timer.pomNotice}
        currentCharacter={currentCharacter}
        progress={timer.progress}
        formattedTime={timer.formattedTime}
        ringColor={isBreak ? 'purple' : 'gold'}
        centerLabel={isBreak ? (isStudying ? '휴식중...' : '곧 휴식하세요') : (isStudying ? '학습중...' : '집중하세요')}
        handleBreakStart={timer.handleBreakStart}
        handleNextRound={timer.handleNextRound}
        handlePomodoroComplete={actions.handlePomodoroComplete}
        onStart={timer.startTimer}
        onPause={timer.pauseTimer}
        onStop={() => { timer.stopTimer(); actions.openStudy(); }}
        onShowQuizCreate={actions.openQuizCreate}
        onShowQuizList={actions.openQuizList}
      />

      <StudyModalsContainer
        modals={modals}
        actions={actions}
        elapsedSeconds={timer.timerMode === 'pomodoro' ? timer.totalStudiedSeconds : timer.elapsedSeconds}
        formattedTime={timer.timerMode === 'pomodoro' ? 
          (() => {
            const m = Math.floor(timer.totalStudiedSeconds / 60);
            const s = timer.totalStudiedSeconds % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
          })() : timer.formattedTime}
      />

      {toastMsg && (
        <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 bg-background/95 border border-border rounded-2xl px-6 py-3 text-foreground text-sm z-[300] shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}
    </div>
  );
};

export default HomePage;
