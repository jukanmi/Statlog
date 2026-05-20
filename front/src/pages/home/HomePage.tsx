import { useState, useEffect, useRef } from 'react';
import { useStudyStore } from '@/store/useStudyStore';
import { useStudyTimer, getPomodoroPhaseSeconds } from '@/hooks/useStudyTimer';
import type { PomodoroConfig } from '@/hooks/useStudyTimer';
import type { StudyDepth } from '@/types';
import TimerRing from './components/TimerRing';
import StudyModal from './components/StudyModal';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import StatUpdateScreen from './components/StatUpdateScreen';
import StreakBonusModal from './components/StreakBonusModal';
import TodayStudyProgress from './components/TodayStudyProgress';
import TimerModeToggle, { type TimerMode } from './components/TimerModeToggle';
import PomodoroIndicator from './components/PomodoroIndicator';
import PomodoroNoticeOverlay, { type PomodoroNotice } from './components/PomodoroNoticeOverlay';
import TimerActionButtons from './components/TimerActionButtons';
import QuizCreateModal from './components/QuizCreateModal';
import QuizListModal from './components/QuizListModal';
import BurnoutWarningModal from './components/BurnoutWarningModal';

const BURNOUT_THRESHOLD_MINUTES = 180; // 3시간

type HomeScreen = 'timer' | 'quiz' | 'result' | 'stat';

const HomePage: React.FC = () => {
  const todayMinutes = useStudyStore((s) => s.todayMinutes);
  const currentSubject = useStudyStore((s) => s.currentSubject);
  const studyStreak = useStudyStore((s) => s.studyStreak);
  const streakBonusPending = useStudyStore((s) => s.streakBonusPending);

  // --- Pomodoro state ---
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

  // --- Screen / modal state ---
  const [screen, setScreen] = useState<HomeScreen>('timer');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedElapsedSeconds, setSavedElapsedSeconds] = useState(0);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [studyDepth, setStudyDepth] = useState<StudyDepth>('understand');
  const [showQuizCreate, setShowQuizCreate] = useState(false);
  const [showQuizList, setShowQuizList] = useState(false);
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [showBurnout, setShowBurnout] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const burnoutShownRef = useRef(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // 번아웃 위험 감지
  useEffect(() => {
    if (!burnoutShownRef.current && todayMinutes >= BURNOUT_THRESHOLD_MINUTES) {
      burnoutShownRef.current = true;
      setShowBurnout(true);
    }
  }, [todayMinutes]);

  const todayFormatted = (() => {
    const h = Math.floor(todayMinutes / 60);
    const m = todayMinutes % 60;
    if (h > 0) return `${h}시간 ${String(m).padStart(2, '0')}분`;
    return `${String(m).padStart(2, '0')}분`;
  })();

  const isStudying = timerState === 'studying';
  const isPaused = timerState === 'paused';
  const isActive = isStudying || isPaused;

  // Total studied seconds (for pomodoro: cumulative + current study phase only)
  const totalStudiedSeconds =
    timerMode === 'pomodoro'
      ? cumulativeStudySeconds +
        (pomPhase === 'study'
          ? Math.min(elapsedSeconds, getPomodoroPhaseSeconds({ phase: 'study', round: pomRound }))
          : 0)
      : elapsedSeconds;

  const totalStudiedFormatted = (() => {
    const m = Math.floor(totalStudiedSeconds / 60);
    const s = totalStudiedSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  })();

  // --- Handlers ---
  const handleStop = () => {
    stopTimer();
    setIsModalOpen(true);
  };

  const handleModalSave = (depth: StudyDepth) => {
    setStudyDepth(depth);
    setSavedElapsedSeconds(timerMode === 'pomodoro' ? totalStudiedSeconds : elapsedSeconds);
    setIsModalOpen(false);
    resetTimer();
    if (timerMode === 'pomodoro') {
      setCumulativeStudySeconds(0);
      setPomPhase('study');
      setPomRound(1);
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
  };

  const handleQuizSkip = () => setScreen('stat');
  const handleResultContinue = () => setScreen('stat');
  const handleStatDone = () => {
    setScreen('timer');
    if (streakBonusPending) setShowStreakBonus(true);
  };

  // Pomodoro notice actions
  const handlePomodoroBreakStart = () => {
    setPomNotice(null);
    setPomPhase('break');
    resetTimer();
  };

  const handlePomodoroNextRound = () => {
    setPomNotice(null);
    setPomPhase('study');
    setPomRound((r) => Math.min(r + 1, 4));
    resetTimer();
  };

  const handlePomodoroComplete = () => {
    setPomNotice(null);
    setSavedElapsedSeconds(cumulativeStudySeconds);
    setStudyDepth('understand');
    resetTimer();
    setCumulativeStudySeconds(0);
    setPomPhase('study');
    setPomRound(1);
    setScreen('quiz');
  };

  const switchMode = (mode: TimerMode) => {
    setTimerMode(mode);
    resetTimer();
    setCumulativeStudySeconds(0);
    setPomPhase('study');
    setPomRound(1);
    setPomNotice(null);
  };

  // --- Non-timer screens ---
  if (screen === 'quiz') {
    return (
      <QuizScreen
        subject={currentSubject || '기타'}
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
        depth={studyDepth}
        onDone={handleStatDone}
      />
    );
  }

  // --- Derived display values ---
  const isPomodoro = timerMode === 'pomodoro';
  const isBreak = isPomodoro && pomPhase === 'break';
  const ringColor = isBreak ? 'purple' : 'gold';
  const centerLabel = isBreak
    ? isStudying ? '휴식중...' : '곧 휴식하세요'
    : isStudying ? '학습중...' : '집중하세요';

  const ambientColor = isBreak
    ? 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)'
    : 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)';

  // --- Timer screen ---
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

      {/* Mode toggle (only when idle and not in active session) */}
      {!isActive && !pomNotice && (
        <TimerModeToggle timerMode={timerMode} onSwitchMode={switchMode} />
      )}

      {/* Pomodoro round indicator (when active) */}
      {isPomodoro && isActive && !pomNotice && (
        <PomodoroIndicator pomRound={pomRound} isBreak={isBreak} />
      )}

      {/* No-round-indicator spacer for normal mode */}
      {(!isPomodoro || !isActive || pomNotice) && isActive && (
        <div style={{ marginBottom: 24 }} />
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

        {/* Pomodoro phase notice overlay */}
        <PomodoroNoticeOverlay
          pomNotice={pomNotice}
          pomRound={pomRound}
          onBreakStart={handlePomodoroBreakStart}
          onNextRound={handlePomodoroNextRound}
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

      {/* Quiz entry buttons — shown when idle */}
      {!isActive && !pomNotice && (
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button
            onClick={() => setShowQuizCreate(true)}
            style={{
              background: 'none',
              border: '1px solid rgba(201,168,76,0.35)',
              borderRadius: 20,
              padding: '7px 16px',
              color: '#C9A84C',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            + 퀴즈 만들기
          </button>
          <button
            onClick={() => setShowQuizList(true)}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '7px 16px',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            내 퀴즈
          </button>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(15,15,26,0.96)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14, padding: '11px 22px', color: '#fff', fontSize: 14,
            zIndex: 300, whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Study modal */}
      <StudyModal
        isOpen={isModalOpen}
        elapsedSeconds={timerMode === 'pomodoro' ? totalStudiedSeconds : elapsedSeconds}
        formattedElapsed={timerMode === 'pomodoro' ? totalStudiedFormatted : formattedTime}
        onSave={(depth) => handleModalSave(depth)}
        onClose={handleModalClose}
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
