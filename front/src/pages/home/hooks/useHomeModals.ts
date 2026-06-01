import { useState } from 'react';

export function useHomeModals() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [showQuizCreate, setShowQuizCreate] = useState(false);
  const [showQuizList, setShowQuizList] = useState(false);
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [showBurnout, setShowBurnout] = useState(false);

  return {
    modals: {
      study: isModalOpen,
      quest: isQuestModalOpen,
      quizCreate: showQuizCreate,
      quizList: showQuizList,
      streakBonus: showStreakBonus,
      burnout: showBurnout,
    },
    actions: {
      openStudy: () => setIsModalOpen(true),
      closeStudy: () => setIsModalOpen(false),
      openQuest: () => setIsQuestModalOpen(true),
      closeQuest: () => setIsQuestModalOpen(false),
      openQuizCreate: () => setShowQuizCreate(true),
      closeQuizCreate: () => setShowQuizCreate(false),
      openQuizList: () => setShowQuizList(true),
      closeQuizList: () => setShowQuizList(false),
      openStreakBonus: () => setShowStreakBonus(true),
      closeStreakBonus: () => setShowStreakBonus(false),
      openBurnout: () => setShowBurnout(true),
      closeBurnout: () => setShowBurnout(false),
    }
  };
}
