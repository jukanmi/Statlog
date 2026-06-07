import React from 'react';
import DailyQuestCard from '@/components/DailyQuestCard';
import TimerRing from './TimerRing';
import TodayStudyProgress from './TodayStudyProgress';
import TimerModeToggle, { type TimerMode } from './TimerModeToggle';
import PomodoroIndicator from './PomodoroIndicator';
import PomodoroNoticeOverlay, { type PomodoroNotice } from './PomodoroNoticeOverlay';
import TimerActionButtons from './TimerActionButtons';
import { type Character } from '@/types';
import { cn } from '@/lib/utils';

interface TimerScreenProps {
  todayMinutes: number;
  todayFormatted: string;
  dailyStudyGoalSubject: string;
  dailyStudyGoalMinutes: number;
  dailyQuestStatus: Record<string, { isClaimed: boolean }>;
  claimDailyQuest: (id: string, reward: { gold: number; gems: number }) => void;
  onEditTarget: () => void;
  timerMode: TimerMode;
  onSwitchMode: (mode: TimerMode) => void;
  pomRound: number;
  isBreak: boolean;
  isActive: boolean;
  isStudying: boolean;
  pomNotice: PomodoroNotice;
  currentCharacter: Character | undefined;
  progress: number;
  formattedTime: string;
  ringColor: 'gold' | 'purple';
  centerLabel: string;
  handleBreakStart: () => void;
  handleNextRound: () => void;
  handlePomodoroComplete: () => void;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onShowQuizCreate: () => void;
  onShowQuizList: () => void;
}

const TimerScreen: React.FC<TimerScreenProps> = ({
  todayMinutes,
  todayFormatted,
  dailyStudyGoalSubject,
  dailyStudyGoalMinutes,
  dailyQuestStatus,
  claimDailyQuest,
  onEditTarget,
  timerMode,
  onSwitchMode,
  pomRound,
  isBreak,
  isActive,
  isStudying,
  pomNotice,
  currentCharacter,
  progress,
  formattedTime,
  ringColor,
  centerLabel,
  handleBreakStart,
  handleNextRound,
  handlePomodoroComplete,
  onStart,
  onPause,
  onStop,
  onShowQuizCreate,
  onShowQuizList,
}) => {
  return (
    <>
      <style>{`
        @keyframes ambientPulse {
          0%, 100% { opacity: 1;    transform: translate(-50%, -50%) scale(1);    }
          50%       { opacity: 1.6; transform: translate(-50%, -50%) scale(1.18); }
        }
      `}</style>

      {/* Ambient glow */}
      <div
        className={cn(
          "absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full pointer-events-none transition-[background] duration-600",
          isBreak 
            ? "bg-[radial-gradient(circle,rgba(167,139,250,0.07)_0%,transparent_70%)]" 
            : "bg-[radial-gradient(circle,rgba(201,168,76,0.07)_0%,transparent_70%)]",
          isStudying && "animate-[ambientPulse_2.5s_ease-in-out_infinite]"
        )}
      />

      {/* Top: today's study time */}
      <TodayStudyProgress formattedTime={todayFormatted} />

      {/* Daily Quest */}
      {!pomNotice && (
        <div className="w-full max-w-[400px] mt-4 z-10">
          <DailyQuestCard
            questId="daily_study_1h"
            title={`[${dailyStudyGoalSubject}] ${dailyStudyGoalMinutes}분 집중하기`}
            description={`'${dailyStudyGoalSubject}' 타이머로 ${dailyStudyGoalMinutes}분 이상 집중하세요.`}
            currentProgress={todayMinutes}
            targetProgress={dailyStudyGoalMinutes}
            reward={{ gold: 50, gems: 5 }}
            isClaimed={dailyQuestStatus['daily_study_1h']?.isClaimed || false}
            onClaim={claimDailyQuest}
            onEditTarget={onEditTarget}
          />
        </div>
      )}

      {/* Mode toggle */}
      {!isActive && !pomNotice && (
        <TimerModeToggle timerMode={timerMode} onSwitchMode={onSwitchMode} />
      )}

      {/* Pomodoro round indicator */}
      {timerMode === 'pomodoro' && isActive && !pomNotice && (
        <PomodoroIndicator pomRound={pomRound} isBreak={isBreak} />
      )}

      {/* Spacer */}
      {(! (timerMode === 'pomodoro') || !isActive || pomNotice) && isActive && (
        <div className="mb-6" />
      )}

      {/* 🦉 캐릭터 홈 화면 표시 레이아웃 */}
      {currentCharacter && (
        <div className="flex flex-col items-center mt-4 z-10 gap-1">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#C9A84C] shadow-2xl">
            <img src={currentCharacter.imageUrl} alt={currentCharacter.name} className="w-full h-full object-cover" />
          </div>
          <span className="text-[10px] text-foreground/70 font-semibold bg-card/60 px-2 py-0.5 rounded-full">
            {currentCharacter.name} (동행 중)
          </span>
        </div>
      )}

      {/* Timer ring */}
      <div className="flex-1 flex items-center justify-center relative w-full">
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
          onStart={onStart}
          onPause={onPause}
          onStop={onStop}
        />
      )}

      {/* Quiz entry buttons */}
      {!isActive && !pomNotice && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={onShowQuizCreate}
            className="bg-transparent border border-[#C9A84C]/35 rounded-full px-4 py-1.5 text-[#C9A84C] text-[13px] font-medium cursor-pointer hover:bg-[#C9A84C]/5 transition-colors"
          >
            + 퀴즈 만들기
          </button>
          <button
            onClick={onShowQuizList}
            className="bg-transparent border border-white/10 rounded-full px-4 py-1.5 text-white/40 text-[13px] font-medium cursor-pointer hover:bg-white/5 transition-colors"
          >
            내 퀴즈
          </button>
        </div>
      )}
    </>
  );
};

export default TimerScreen;
