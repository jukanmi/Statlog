import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Clock, Flag, Lightbulb } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { generateQuiz } from '@/lib/api';
import { getQuizBySubject, type Quiz } from '@/lib/generateQuiz';
import { useStudyStore } from '@/store/useStudyStore';
import QuizReportModal from './QuizReportModal';
import { Skeleton } from '@/components/ui/skeleton';
import { getRandomTip } from '@/constants/studyTips';

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

function Toast({ msg }: { msg: string }) {
  return (
    <div
      style={{
        position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(15,15,26,0.96)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14, padding: '11px 22px', color: '#fff', fontSize: 14,
        zIndex: 600, whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        animation: 'toastIn 200ms ease',
      }}
    >
      {msg}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

const QuizSkeleton = ({ currentTip }: { currentTip: string }) => {
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
      }}
    >
      {/* Top Bar Skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton className="w-9 h-9 rounded-full bg-white/10" />
          <Skeleton className="w-9 h-9 rounded-full bg-white/5" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Skeleton className="h-5 w-16 bg-white/10" />
          <div style={{ display: 'flex', gap: 8 }}>
            <Skeleton className="h-2 w-5 bg-white/10 rounded-full" />
            <Skeleton className="h-2 w-2 bg-white/5 rounded-full" />
            <Skeleton className="h-2 w-2 bg-white/5 rounded-full" />
          </div>
          <Skeleton className="h-4 w-10 bg-white/5" />
        </div>
      </div>

      {/* Question Card Skeleton */}
      <div
        style={{
          backgroundColor: '#1A1A2E',
          borderRadius: 20,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 16,
        }}
      >
        <Skeleton className="h-6 w-16 bg-white/10 rounded-full mb-4" />
        <Skeleton className="h-5 w-full bg-white/10 mb-2" />
        <Skeleton className="h-5 w-3/4 bg-white/10" />
      </div>

      {/* Answer Options Skeletons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 20px',
              borderRadius: 14,
              backgroundColor: '#1A1A2E',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Skeleton className="w-7 h-7 rounded-full bg-white/10 flex-shrink-0" />
            <Skeleton className="h-4 w-2/3 bg-white/5" />
          </div>
        ))}
      </div>

      {/* Message & Tip at the bottom */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Study Tip Box */}
        <div
          style={{
            backgroundColor: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            gap: 14,
            animation: 'fadeIn 300ms ease-out',
          }}
        >
          <Lightbulb size={22} style={{ color: '#C9A84C', flexShrink: 0, marginTop: 2 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              잠깐! 공부 팁
            </span>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6, animation: 'tipIn 500ms ease-out' }} key={currentTip}>
              {currentTip}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#C9A84C', fontWeight: 600, margin: 0, animation: 'pulse 2s infinite' }}>
            AI가 맞춤형 복습 문제를 출제 중입니다...
          </p>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tipIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const QuizScreen: React.FC<QuizScreenProps> = ({ subject, content, onComplete, onSkip }) => {
  const lastSessionQuiz = useStudyStore((s) => s.lastSessionQuiz);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctResults, setCorrectResults] = useState<boolean[]>([]);
  const [advancing, setAdvancing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentTip, setCurrentTip] = useState(getRandomTip());

  const correctAtSelect = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const correctCount = useMemo(() => correctResults.filter(Boolean).length, [correctResults]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleReportSubmit = (reason: string) => {
    console.log('Quiz reported:', { reason });
    showToast('신고가 접수되었습니다');
  };

  // TanStack Query로 퀴즈 데이터 관리
  const { data: quizzes, isLoading, error: loadError } = useQuery({
    queryKey: ['quiz', content, subject],
    queryFn: async () => {
      // 만약 이전 세션 데이터가 있으면 그것을 우선 사용
      if (lastSessionQuiz && lastSessionQuiz.length > 0) {
        return lastSessionQuiz.map(item => ({
          question: item.question,
          options: item.options,
          correctIndex: item.correctIndex,
          explanation: item.explanation,
        }));
      }

      const q = await generateQuiz(content);
      if (q.length === 0) {
        const fallback = getQuizBySubject(subject);
        if (fallback.length === 0) throw new Error('생성된 퀴즈가 없습니다');
        return fallback;
      }
      return q;
    },
    staleTime: 1000 * 60 * 5, // 5분간 캐싱
  });

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
    setShowExplanation(false);
  }, [currentIndex]);

  useEffect(() => {
    let tipInterval: any;
    if (isLoading && !loadError) {
      setCurrentTip(getRandomTip());
      tipInterval = setInterval(() => {
        setCurrentTip(getRandomTip());
      }, 5000);
    }
    return () => clearInterval(tipInterval);
  }, [isLoading, loadError]);

  const handleTimeout = useCallback(() => {
    setSelectedIndex(-1);
    setCorrectResults((prev) => {
      const newResults = [...prev, false];
      setAdvancing(true);
      timeoutRef.current = setTimeout(() => {
        if (quizzes && currentIndex < quizzes.length - 1) {
          setCurrentIndex((p) => p + 1);
          setSelectedIndex(null);
          setAdvancing(false);
        } else {
          onComplete(newResults);
        }
      }, 1500);
      return newResults;
    });
  }, [currentIndex, quizzes, onComplete]);

  useEffect(() => {
    if (!quizzes || selectedIndex !== null || advancing) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, quizzes, selectedIndex, advancing, handleTimeout]);

  // --- 에러: 잠시 표시 후 자동 스킵 ---
  if (loadError) {
    return (
      <div style={screenStyle}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>⚠️</div>
        <p style={{ fontSize: 16, color: '#FFFFFF', fontWeight: 600, margin: 0 }}>
          퀴즈를 만들지 못했어요
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          {(loadError as Error).message || '퀴즈 생성에 실패했어요'} · 잠시 후 다음 단계로 넘어갑니다
        </p>
      </div>
    );
  }

  // --- 로딩: AI 퀴즈 생성 중 (스켈레톤 적용) ---
  if (isLoading || !quizzes) {
    return <QuizSkeleton currentTip={currentTip} />;
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

    if (currentIndex < TOTAL - 1) {
      correctAtSelect.current = newResults.filter(Boolean).length;
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
        
        <div style={{ display: 'flex', gap: 8 }}>
          {/* 닫기 버튼 */}
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

          {/* 신고 버튼 */}
          <button
            onClick={() => setReportModalOpen(true)}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              backgroundColor: 'rgba(239,68,68,0.1)', color: 'rgba(239,68,68,0.6)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="퀴즈 신고"
          >
            <Flag size={16} />
          </button>
        </div>

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
        {quiz.options?.map((option, i) => (
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
      {showExplanation && quiz.explanation && (
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
            {quiz.explanation}
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
          {currentIndex < TOTAL - 1 ? '다음' : '결과 보기'}
        </button>
      </div>
      <style>{`
        @keyframes quizTimerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* 모달 및 알림 */}
      <QuizReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportSubmit}
      />
      {toastMsg && <Toast msg={toastMsg} />}
    </div>
  );
};

export default QuizScreen;
