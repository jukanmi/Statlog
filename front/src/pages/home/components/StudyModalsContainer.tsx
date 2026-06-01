import React from 'react';
import StudyModal from '../components/StudyModal';
import QuestGoalModal from '../components/QuestGoalModal';
import StreakBonusModal from '../components/StreakBonusModal';
import BurnoutWarningModal from '../components/BurnoutWarningModal';
import QuizCreateModal from '../components/QuizCreateModal';
import QuizListModal from '../components/QuizListModal';
import { useQuestStore } from '@/store/useQuestStore';
import { useStudyStore } from '@/store/useStudyStore';

interface StudyModalsContainerProps {
  modals: {
    study: boolean;
    quest: boolean;
    streakBonus: boolean;
    burnout: boolean;
    quizCreate: boolean;
    quizList: boolean;
  };
  actions: {
    handleModalSave: (subject: string, note: string) => void;
    closeStudy: () => void;
    closeQuest: () => void;
    closeStreakBonus: () => void;
    closeBurnout: () => void;
    closeQuizCreate: () => void;
    closeQuizList: () => void;
    showToast: (msg: string) => void;
  };
  elapsedSeconds: number;
  formattedTime: string;
}

const StudyModalsContainer: React.FC<StudyModalsContainerProps> = ({
  modals,
  actions,
  elapsedSeconds,
  formattedTime,
}) => {
  const { dailyStudyGoalMinutes, dailyStudyGoalSubject, updateDailyStudyGoal } = useQuestStore();
  const { studyStreak, todayMinutes } = useStudyStore();

  return (
    <>
      <StudyModal
        isOpen={modals.study}
        elapsedSeconds={elapsedSeconds}
        formattedElapsed={formattedTime}
        onSave={actions.handleModalSave}
        onClose={actions.closeStudy}
      />

      <QuestGoalModal
        isOpen={modals.quest}
        initialMinutes={dailyStudyGoalMinutes}
        initialSubject={dailyStudyGoalSubject}
        onSave={(minutes, subject) => {
          updateDailyStudyGoal(minutes, subject);
          actions.closeQuest();
        }}
        onClose={actions.closeQuest}
      />

      {modals.streakBonus && (
        <StreakBonusModal
          streak={studyStreak}
          onClose={actions.closeStreakBonus}
        />
      )}

      {modals.burnout && (
        <BurnoutWarningModal
          todayMinutes={todayMinutes}
          onClose={actions.closeBurnout}
          onAcceptRest={() => {
            actions.closeBurnout();
            actions.showToast('잘 쉬세요! 보상이 지급됐어요');
          }}
        />
      )}

      <QuizCreateModal
        isOpen={modals.quizCreate}
        onClose={actions.closeQuizCreate}
        onCreated={() => {
          actions.closeQuizCreate();
          actions.showToast('퀴즈가 추가됐어요!');
        }}
      />

      <QuizListModal
        isOpen={modals.quizList}
        onClose={actions.closeQuizList}
      />
    </>
  );
};

export default StudyModalsContainer;
