import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Clock } from 'lucide-react';
import { generateQuiz, type Quiz } from '@/lib/api';
import { useStudyStore } from '@/store/useStudyStore';

interface QuizScreenProps {
  subject: string;
  content: string;
  onComplete: (correctResults: boolean[]) => void;
  onSkip: () => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

// 로딩/에러 화면 공통 컨테이너
const screenStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  backgroundColor: '#0F0F1A',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 32px',
  maxWidth: 430,
  margin: '0 auto',
  textAlign: 'center',
};

const QuizScreen: React.FC<QuizScreenProps> = ({ subject, content, onComplete, onSkip }) => {
  const lastSessionQuizFromStore = useStudyStore((s) => s.lastSessionQuiz);
  
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctResults, setCorrectResults] = useState<boolean[]>([]);
  const [advancing, setAdvancing] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalQuestions = quizzes?.length || 0;

  // 1. Store에 이미 퀴즈가 있다면 (StudyModal에서 생성됨) 그것을 사용
  // 2. Store에 퀴즈가 없고 학습 내용이 있다면 AI 퀴즈 생성 시도 (Legacy/Fallback)
  useEffect(() => {
    if (lastSessionQuizFromStore && lastSessionQuizFromStore.length > 0) {
      setQuizzes(lastSessionQuizFromStore.map(item => ({
        question: item.question,
        options: item.choices,
        correctIndex: item.correctIndex,
        explanation: item.explanation,
      })));
      return;
    }

    let cancelled = false;
    setQuizzes(null);
    setLoadError(null);
    generateQuiz(content)
      .then((q) => {
        if (cancelled) return;
        if (q.length === 0) setLoadError('생성된 퀴즈가 없습니다');
        else setQuizzes(q);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : '퀴즈 생성에 실패했어요');
      });
    return () => {
      cancelled = true;
    };
  }, [content, lastSessionQuizFromStore]);

  // 퀴즈 생성 실패 시: 에러를 잠시 보여준 뒤 자동으로 스킵
  useEffect(() => {
    if (!loadError) return;
    const t = setTimeout(onSkip, 2200);
    return () => clearTimeout(t);
  }, [loadError, onSkip]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setTimeLeft(30);
  }, [currentIndex]);

  useEffect(() => {
    if (!quizzes || selectedIndex !== null || advancing) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, quizzes, selectedIndex, advancing]);

  const handleTimeout = () => {
    setSelectedIndex(-1);
    const newResults = [...correctResults, false];
    setCorrectResults(newResults);
    setAdvancing(true);
    timeoutRef.current = setTimeout(() => {
      if (currentIndex < quizzes!.length - 1) {
        setCurrentIndex((p) => p + 1);
        setSelectedIndex(null);
        setAdvancing(false);
      } else {
        onComplete(newResults);
      }
    }, 1500);
  };

  // --- 에러: 잠시 표시 후 자동 스킵 ---
  if (loadError) {
    return (
      <div style={screenStyle}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>⚠️</div>
        <p style={{ fontSize: 16, color: '#FFFFFF', fontWeight: 600, margin: 0 }}>
          퀴즈를 만들지 못했어요
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          {loadError} · 잠시 후 다음 단계로 넘어갑니다
        </p>
      </div>
    );
  }

  // --- 로딩: AI 퀴즈 생성 중 ---
  if (!quizzes) {
    return (
      <div style={screenStyle}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🧩</div>
        <p style={{ fontSize: 16, color: '#FFFFFF', fontWeight: 600, margin: 0 }}>
          AI가 복습 퀴즈를 만들고 있어요...
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          잠시만 기다려 주세요
        </p>
      </div>
    );
  }

  // 여기서부터 quizzes 보장됨
  const TOTAL = quizzes.length;
  const quiz = quizzes[currentIndex];

  const handleSelect = (optionIndex: number) => {
    if (selectedIndex !== null || advancing) return;
    setSelectedIndex(optionIndex);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const isCorrect = selectedIndex === quiz.correctIndex;
    const newResults = [...correctResults, isCorrect];
    setCorrectResults(newResults);
    setAdvancing(true);
    setShowExplanation(false);

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((p) => p + 1);
      setSelectedIndex(null);
      setAdvancing(false);
    } else {
      onComplete(newResults);
    }
  };

  const getOptionStyle = (optionIndex: number): React.CSSProperties => {
    if (selectedIndex === null) {
      return {
        backgroundColor: '#1A1A2E',
        border: '1px solid rgba(255,255,255,0.1)',
      };
    }
    const isCorrect = optionIndex === quiz.correctIndex;
    const isSelected = optionIndex === selectedIndex;
    if (isCorrect) {
      return {
        backgroundColor: 'rgba(34,197,94,0.1)',
        border: '1.5px solid #22C55E',
      };
    }
    if (isSelected && !isCorrect) {
      return {
        backgroundColor: 'rgba(239,68,68,0.1)',
        border: '1.5px solid #EF4444',
      };
    }
    return {
      backgroundColor: '#1A1A2E',
      border: '1px solid rgba(255,255,255,0.06)',
    };
  };

  const getBadgeStyle = (optionIndex: number): React.CSSProperties => {
    if (selectedIndex === null) {
      return { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' };
    }
    const isCorrect = optionIndex === quiz.correctIndex;
    const isSelected = optionIndex === selectedIndex;
    if (isCorrect) return { backgroundColor: 'rgba(34,197,94,0.2)', color: '#22C55E' };
    if (isSelected) return { backgroundColor: 'rgba(239,68,68,0.2)', color: '#EF4444' };
    return { backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: '#0F0F1A',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 20px',
        paddingTop: 'calc(56px + env(safe-area-inset-top))',
        paddingBottom: 'calc(40px + env(safe-area-inset-bottom))',
        maxWidth: 430,
        margin: '0 auto',
        overflowY: 'auto',
      }}
    >

        {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        
        {/* 닫기 버튼 (기존 유지) */}
        <button
          onClick={onSkip}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>

        {/* ▼ 새롭게 묶인 오른쪽 UI 영역 (시계 + 막대기 + 문제번호) ▼ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          
          {/* 1. 새로 추가된 시계 UI */}
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 6, 
            color: timeLeft <= 10 ? '#EF4444' : '#FBBF24',
            fontWeight: 700, fontSize: 15,
            animation: timeLeft <= 10 ? 'quizTimerPulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
          }}>
            <Clock size={16} />
            {timeLeft}초
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentIndex ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === currentIndex
                    ? '#C9A84C'
                    : i < currentIndex
                      ? 'rgba(201,168,76,0.4)'
                      : 'rgba(255,255,255,0.12)',
                  transition: 'all 300ms ease',
                }}
              />
            ))}
          </div>

          {/* 3. 현재 진행도 숫자 표시 (예: 1 / 3) */}
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>
            {currentIndex + 1} / {TOTAL}
          </span>

        </div>
        {/* ▲ 오른쪽 UI 영역 끝 ▲ */}
        
      </div>

      {/* Question card */}
      <div
        style={{
          backgroundColor: '#1A1A2E',
          borderRadius: 20,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 16,
        }}
      >
        {/* Subject badge */}
        <div style={{ marginBottom: 14 }}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(201,168,76,0.15)',
              color: '#C9A84C',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {subject}
          </span>
        </div>

        {/* Question text */}
        <p
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#FFFFFF',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {quiz.question}
        </p>
      </div>

      {/* Answer options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {quiz.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={selectedIndex !== null}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 20px',
              borderRadius: 14,
              cursor: selectedIndex !== null ? 'default' : 'pointer',
              textAlign: 'left',
              transition: 'all 200ms ease',
              ...getOptionStyle(i),
            }}
          >
            {/* Letter badge */}
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
                transition: 'all 200ms ease',
                ...getBadgeStyle(i),
              }}
            >
              {OPTION_LABELS[i]}
            </span>
            <span style={{ fontSize: 15, color: '#FFFFFF', lineHeight: 1.4 }}>
              {option}
            </span>
          </button>
        ))}
      </div>

      {/* Explanation */}
      {showExplanation && (quiz as any).explanation && (
        <div
          style={{
            backgroundColor: 'rgba(201,168,76,0.05)',
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            animation: 'fadeIn 300ms ease-out',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#C9A84C', marginBottom: 6 }}>해설</div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>
            {(quiz as any).explanation}
          </p>
        </div>
      )}

      {/* Next button — appears after selection */}
      <div
        style={{
          marginTop: 'auto',
          opacity: selectedIndex !== null ? 1 : 0,
          transform: selectedIndex !== null ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 200ms ease, transform 200ms ease',
          pointerEvents: selectedIndex !== null ? 'auto' : 'none',
        }}
      >
        <button
          onClick={handleNext}
          style={{
            width: '100%',
            height: 52,
            backgroundColor: '#C9A84C',
            border: 'none',
            borderRadius: 14,
            color: '#0F0F1A',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {currentIndex < totalQuestions - 1 ? '다음' : '결과 보기'}
        </button>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes quizTimerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
};

export default QuizScreen;
