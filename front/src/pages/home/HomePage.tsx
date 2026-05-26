import { useState, useEffect, useRef } from 'react';
import { useStudyStore } from '@/store/useStudyStore';
import { useQuestStore } from '@/store/useQuestStore';
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import DailyQuestCard from '@/components/DailyQuestCard';
import TimerRing from './components/TimerRing';
import StudyModal from './components/StudyModal';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import StatUpdateScreen from './components/StatUpdateScreen';
import TodayStudyProgress from './components/TodayStudyProgress';
import TimerModeToggle, { type TimerMode } from './components/TimerModeToggle';
import PomodoroIndicator from './components/PomodoroIndicator';
import PomodoroNoticeOverlay, { type PomodoroNotice } from './components/PomodoroNoticeOverlay';
import TimerActionButtons from './components/TimerActionButtons';
import QuestGoalModal from './components/QuestGoalModal';
import { convertStudyToStats, type StatConversionResult } from '@/lib/api';
import QuizCreateModal from './components/QuizCreateModal';
import QuizListModal from './components/QuizListModal';
import StreakBonusModal from './components/StreakBonusModal';
import BurnoutWarningModal from './components/BurnoutWarningModal';
import { useUserStore } from '@/store/useUserStore';
import { ALL_CHARACTERS } from '@/lib/gachaSystem'; // 🦉 캐릭터 리스트 임포트

const BURNOUT_THRESHOLD_MINUTES = 180; // 3시간

type HomeScreen = 'timer' | 'quiz' | 'result' | 'stat';

const HomePage: React.FC = () => {
  const todayMinutes = useStudyStore((s) => s.todayMinutes);
  const currentSubject = useStudyStore((s) => s.currentSubject);
  const currentContent = useStudyStore((s) => s.currentContent);
  const studyStreak = useStudyStore((s) => s.studyStreak);
  const streakBonusPending = useStudyStore((s) => s.streakBonusPending);

  // 🧬 장착된 대표 캐릭터 정보 스토어에서 실시간 구독
  const equippedCharacterId = useUserStore((s) => s.equippedCharacterId);
  const currentCharacter = ALL_CHARACTERS.find(c => c.id === equippedCharacterId);

  const {
    dailyQuestStatus,
    claimDailyQuest,
    checkQuestReset,
    dailyStudyGoalMinutes,
    dailyStudyGoalSubject,
    updateDailyStudyGoal,
  } = useQuestStore();

  useEffect(() => {
    checkQuestReset();
  }, [checkQuestReset]);

  const {
    timerMode,
    pomPhase,
    pomRound,
    pomNotice,
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
    handlePomodoroComplete: completePomodoroSession,
    switchMode,
  } = usePomodoroTimer();

  const [screen, setScreen] = useState<HomeScreen>('timer');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [savedElapsedSeconds, setSavedElapsedSeconds] = useState(0);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [showQuizCreate, setShowQuizCreate] = useState(false);
  const [showQuizList, setShowQuizList] = useState(false);
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [showBurnout, setShowBurnout] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const burnoutShownRef = useRef(false);

  const [statGained, setStatGained] = useState<StatConversionResult | null>(null);
  const [statLoading, setStatLoading] = useState(false);
  const [statError, setStatError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  useEffect(() => {
    if (!burnoutShownRef.current && todayMinutes >= BURNOUT_THRESHOLD_MINUTES) {
      burnoutShownRef.current = true;
      setShowBurnout(true);
    }
  }, [todayMinutes]);

  const fetchStatGained = async (elapsed: number) => {
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
  };

  const todayFormatted = (() => {
    const h = Math.floor(todayMinutes / 60);
    const m = todayMinutes % 60;
    if (h > 0) return `${h}시간 ${String(m).padStart(2, '0')}분`;
    return `${String(m).padStart(2, '0')}분`;
  })();

  const isStudying = timerState === 'studying';
  const isPaused = timerState === 'paused';
  const isActive = isStudying || isPaused;

  const totalStudiedFormatted = (() => {
    const m = Math.floor(totalStudiedSeconds / 60);
    const s = totalStudiedSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  })();

  const handleEditTarget = () => {
    setIsQuestModalOpen(true);
  };

  const handleQuestGoalSave = (minutes: number, subject: string) => {
    updateDailyStudyGoal(minutes, subject);
  };

  const handleStop = () => {
    stopTimer();
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    setSavedElapsedSeconds(timerMode === 'pomodoro' ? totalStudiedSeconds : elapsedSeconds);
    setIsModalOpen(false);

    if (timerMode === 'pomodoro') {
      completePomodoroSession();
    } else {
      resetTimer();
    }

    setScreen('quiz');
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    resetTimer();
  };

  const handleQuizComplete = (correctCount: number) => {
    setQuizCorrectCount(correctCount);
    setScreen('result');
    if (correctCount > 0) {
      void fetchStatGained(savedElapsedSeconds);
    }
  };

  const handleQuizSkip = () => setScreen('stat');
  const handleResultContinue = () => setScreen('stat');
  const handleStatDone = () => {
    const calculatedCharacterExp = Math.max(10, Math.min(45, Math.round(savedElapsedSeconds / 180)));

    useUserStore.getState().gainEquippedCharacterExp(calculatedCharacterExp).then((res) => {
      if (res.toast) {
        showToast(res.toast);
      }
    });
    
    setScreen('timer');
    setStatGained(null);
    setStatError(null);
    if (streakBonusPending) setShowStreakBonus(true);
  };

  const handlePomodoroComplete = () => {
    const saved = completePomodoroSession();
    setSavedElapsedSeconds(saved);
    setScreen('quiz');
  };

  if (screen === 'quiz') {
    return (
      <QuizScreen
        subject={currentSubject || '기타'}
        content={currentContent}
        onComplete={handleQuizComplete}
        onSkip={handleQuizSkip}
      />
    );
  }
  if (screen === 'result') {
    return (
      <ResultScreen
        correctCount={quizCorrectCount}
        totalCount={3}
        onContinue={handleResultContinue}
      />
    );
  }
  if (screen === 'stat') {
    return (
      <StatUpdateScreen
        subject={currentSubject || '기타'}
        elapsedSeconds={savedElapsedSeconds}
        statGained={statGained}
        loading={statLoading}
        error={statError}
        onDone={handleStatDone}
      />
    );
  }

  const isPomodoro = timerMode === 'pomodoro';
  const isBreak = isPomodoro && pomPhase === 'break';
  const ringColor = isBreak ? 'purple' : 'gold';
  const centerLabel = isBreak
    ? isStudying ? '휴식중...' : '곧 휴식하세요'
    : isStudying ? '학습중...' : '집중하세요';

  const ambientColor = isBreak
    ? 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)'
    : 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)';

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#0F0F1A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 24px',
        paddingTop: 'calc(48px + env(safe-area-inset-top))',
        paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes ambientPulse {
          0%, 100% { opacity: 1;    transform: translate(-50%, -50%) scale(1);    }
          50%       { opacity: 1.6; transform: translate(-50%, -50%) scale(1.18); }
        }
      `}</style>

      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: ambientColor,
          pointerEvents: 'none',
          animation: isStudying ? 'ambientPulse 2.5s ease-in-out infinite' : undefined,
          transition: 'background 600ms ease',
        }}
      />

      {/* Top: today's study time */}
      <TodayStudyProgress formattedTime={todayFormatted} />

      {/* Daily Quest */}
      {!pomNotice && (
        <div style={{ width: '100%', maxWidth: 400, marginTop: 16, zIndex: 10 }}>
          <DailyQuestCard
            questId="daily_study_1h"
            title={`[${dailyStudyGoalSubject}] ${dailyStudyGoalMinutes}분 집중하기`}
            description={`'${dailyStudyGoalSubject}' 타이머로 ${dailyStudyGoalMinutes}분 이상 집중하세요.`}
            currentProgress={todayMinutes}
            targetProgress={dailyStudyGoalMinutes}
            reward={{ gold: 50, gems: 5 }}
            isClaimed={dailyQuestStatus['daily_study_1h']?.isClaimed || false}
            onClaim={claimDailyQuest}
            onEditTarget={handleEditTarget}
          />
        </div>
      )}

      {/* Mode toggle */}
      {!isActive && !pomNotice && (
        <TimerModeToggle timerMode={timerMode} onSwitchMode={switchMode} />
      )}

      {/* Pomodoro round indicator */}
      {isPomodoro && isActive && !pomNotice && (
        <PomodoroIndicator pomRound={pomRound} isBreak={isBreak} />
      )}

      {/* Spacer */}
      {(!isPomodoro || !isActive || pomNotice) && isActive && (
        <div style={{ marginBottom: 24 }} />
      )}

      {/* 🦉 임시 UI: 장착한 대표 캐릭터 홈 화면 표시 레이아웃 */}
      {currentCharacter && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16, zIndex: 10, gap: 4 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid #C9A84C', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <img src={currentCharacter.imageUrl} alt={currentCharacter.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, backgroundColor: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: 10 }}>
            {currentCharacter.name} (동행 중)
          </span>
        </div>
      )}

      {/* Timer ring */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <TimerRing
          progress={progress}
          formattedTime={formattedTime}
          isStudying={isStudying}
          ringColor={ringColor}
          centerLabel={centerLabel}
        />

        <PomodoroNoticeOverlay
          pomNotice={pomNotice}
          pomRound={pomRound}
          onBreakStart={handleBreakStart}
          onNextRound={handleNextRound}
          onComplete={handlePomodoroComplete}
        />
      </div>

      {/* Buttons */}
      {!pomNotice && (
        <TimerActionButtons
          isActive={isActive}
          isStudying={isStudying}
          isBreak={isBreak}
          onStart={startTimer}
          onPause={pauseTimer}
          onStop={handleStop}
        />
      )}

      {/* Quiz entry buttons */}
      {!isActive && !pomNotice && (
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button
            onClick={() => setShowQuizCreate(true)}
            style={{
              background: 'none', border: '1px solid rgba(201,168,76,0.35)',
              borderRadius: 20, padding: '7px 16px', color: '#C9A84C',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            + 퀴즈 만들기
          </button>
          <button
            onClick={() => setShowQuizList(true)}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '7px 16px', color: 'rgba(255,255,255,0.4)',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            내 퀴즈
          </button>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15,15,26,0.96)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14, padding: '11px 22px', color: '#fff', fontSize: 14,
          zIndex: 300, whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {toastMsg}
        </div>
      )}

      {/* Study modal */}
      <StudyModal
        isOpen={isModalOpen}
        elapsedSeconds={timerMode === 'pomodoro' ? totalStudiedSeconds : elapsedSeconds}
        formattedElapsed={timerMode === 'pomodoro' ? totalStudiedFormatted : formattedTime}
        onSave={handleModalSave}
        onClose={handleModalClose}
      />

      {/* Quest Goal modal */}
      <QuestGoalModal
        isOpen={isQuestModalOpen}
        initialMinutes={dailyStudyGoalMinutes}
        initialSubject={dailyStudyGoalSubject}
        onSave={handleQuestGoalSave}
        onClose={() => setIsQuestModalOpen(false)}
      />

      {/* Streak bonus modal */}
      {showStreakBonus && (
        <StreakBonusModal
          streak={studyStreak}
          onClose={() => setShowStreakBonus(false)}
        />
      )}

      {/* 번아웃 경고 모달 */}
      {showBurnout && (
        <BurnoutWarningModal
          todayMinutes={todayMinutes}
          onClose={() => setShowBurnout(false)}
          onAcceptRest={() => {
            setShowBurnout(false);
            showToast('잘 쉬세요! 보상이 지급됐어요');
          }}
        />
      )}

      <QuizCreateModal
        isOpen={showQuizCreate}
        onClose={() => setShowQuizCreate(false)}
        onCreated={() => showToast('퀴즈가 추가됐어요! 다음 학습에 출제돼요')}
      />

      <QuizListModal
        isOpen={showQuizList}
        onClose={() => setShowQuizList(false)}
      />
    </div>
  );
};

export default HomePage;