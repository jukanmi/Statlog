import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getQuizBySubject } from '@/lib/generateQuiz';
import type { Quiz } from '@/types';

interface QuizScreenProps {
  subject: string;
  onComplete: (correctCount: number) => void;
  onSkip: () => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const TOTAL = 3;

const QuizScreen: React.FC<QuizScreenProps> = ({ subject, onComplete, onSkip }) => {
  const [quizzes] = useState<Quiz[]>(() => getQuizBySubject(subject));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const correctAtSelect = useRef(0);

  // Short answer state
  const [shortText, setShortText] = useState('');
  const [shortSubmitted, setShortSubmitted] = useState(false);
  const [shortCorrect, setShortCorrect] = useState(false);

  const quiz = quizzes[currentIndex];
  const quizType = quiz.type ?? 'multiple';

  const advanceOrComplete = (newCount: number) => {
    setAdvancing(true);
    setTimeout(() => {
      if (currentIndex < TOTAL - 1) {
        correctAtSelect.current = newCount;
        setCurrentIndex((p) => p + 1);
        setSelectedIndex(null);
        setShortText('');
        setShortSubmitted(false);
        setShortCorrect(false);
        setAdvancing(false);
      } else {
        onComplete(newCount);
      }
    }, quizType === 'short' ? 1400 : 800);
  };

  // Multiple choice auto-advance
  useEffect(() => {
    if (selectedIndex === null || quizType !== 'multiple') return;
    const isCorrect = selectedIndex === quiz.correctIndex;
    const newCount = correctAtSelect.current + (isCorrect ? 1 : 0);
    if (isCorrect) setCorrectCount(newCount);
    advanceOrComplete(newCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  const handleSelect = (optionIndex: number) => {
    if (selectedIndex !== null || advancing) return;
    setSelectedIndex(optionIndex);
  };

  const handleShortSubmit = () => {
    if (!shortText.trim() || shortSubmitted || advancing) return;
    const correct = shortText.trim().toLowerCase().includes((quiz.answer ?? '').toLowerCase());
    const newCount = correctAtSelect.current + (correct ? 1 : 0);
    if (correct) setCorrectCount(newCount);
    setShortCorrect(correct);
    setShortSubmitted(true);
    advanceOrComplete(newCount);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    if (currentIndex < TOTAL - 1) {
      correctAtSelect.current = correctCount;
      setCurrentIndex((p) => p + 1);
      setSelectedIndex(null);
      setShortText('');
      setShortSubmitted(false);
      setShortCorrect(false);
      setAdvancing(false);
    } else {
      onComplete(correctCount);
    }
  };

  const getOptionStyle = (optionIndex: number): React.CSSProperties => {
    if (selectedIndex === null) {
      return { backgroundColor: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)' };
    }
    const isCorrect = optionIndex === quiz.correctIndex;
    const isSelected = optionIndex === selectedIndex;
    if (isCorrect) return { backgroundColor: 'rgba(34,197,94,0.1)', border: '1.5px solid #22C55E' };
    if (isSelected && !isCorrect) return { backgroundColor: 'rgba(239,68,68,0.1)', border: '1.5px solid #EF4444' };
    return { backgroundColor: '#1A1A2E', border: '1px solid rgba(255,255,255,0.06)' };
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
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
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

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentIndex ? 20 : 8, height: 8, borderRadius: 4,
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

        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>
          {currentIndex + 1} / {TOTAL}
        </span>
      </div>

      {/* Question card */}
      <div
        style={{
          backgroundColor: '#1A1A2E', borderRadius: 20, padding: 24,
          border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16,
        }}
      >
        <div style={{ marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-block', backgroundColor: 'rgba(201,168,76,0.15)',
              color: '#C9A84C', borderRadius: 20, padding: '4px 12px',
              fontSize: 12, fontWeight: 600,
            }}
          >
            {subject}
          </span>
          {quizType === 'short' && (
            <span
              style={{
                display: 'inline-block', backgroundColor: 'rgba(167,139,250,0.15)',
                color: '#A78BFA', borderRadius: 20, padding: '4px 10px',
                fontSize: 12, fontWeight: 600,
              }}
            >
              주관식
            </span>
          )}
        </div>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.6, margin: 0 }}>
          {quiz.question}
        </p>
      </div>

      {/* Answer area */}
      {quizType === 'multiple' ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {(quiz.options ?? []).map((option, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={selectedIndex !== null}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px', borderRadius: 14,
                  cursor: selectedIndex !== null ? 'default' : 'pointer',
                  textAlign: 'left', transition: 'all 200ms ease',
                  ...getOptionStyle(i),
                }}
              >
                <span
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                    transition: 'all 200ms ease',
                    ...getBadgeStyle(i),
                  }}
                >
                  {OPTION_LABELS[i]}
                </span>
                <span style={{ fontSize: 15, color: '#FFFFFF', lineHeight: 1.4 }}>{option}</span>
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: 20,
              opacity: selectedIndex !== null ? 1 : 0,
              transform: selectedIndex !== null ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 200ms ease, transform 200ms ease',
              pointerEvents: selectedIndex !== null ? 'auto' : 'none',
            }}
          >
            <button
              onClick={handleNext}
              style={{
                width: '100%', height: 52, backgroundColor: '#C9A84C', border: 'none',
                borderRadius: 14, color: '#0F0F1A', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {currentIndex < TOTAL - 1 ? '다음' : '결과 보기'}
            </button>
          </div>
        </>
      ) : (
        /* Short answer area */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {/* Hint */}
          {quiz.hint && !shortSubmitted && (
            <div
              style={{
                backgroundColor: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: 12, padding: '10px 14px',
                color: 'rgba(255,255,255,0.5)', fontSize: 13,
              }}
            >
              힌트: {quiz.hint}
            </div>
          )}

          {/* Input */}
          <input
            value={shortText}
            onChange={(e) => !shortSubmitted && setShortText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleShortSubmit()}
            placeholder="정답을 입력하세요"
            disabled={shortSubmitted}
            style={{
              padding: '16px 20px', borderRadius: 14, fontSize: 16,
              color: '#FFFFFF', outline: 'none',
              backgroundColor: shortSubmitted
                ? (shortCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)')
                : '#1A1A2E',
              border: shortSubmitted
                ? `1.5px solid ${shortCorrect ? '#22C55E' : '#EF4444'}`
                : '1px solid rgba(255,255,255,0.1)',
              transition: 'all 200ms ease',
            }}
          />

          {/* Result after submit */}
          {shortSubmitted && (
            <div
              style={{
                backgroundColor: '#1A1A2E', borderRadius: 14, padding: '14px 18px',
                border: `1px solid ${shortCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}
            >
              {shortCorrect ? (
                <div style={{ color: '#22C55E', fontSize: 15, fontWeight: 600 }}>정답!</div>
              ) : (
                <>
                  <div style={{ color: '#EF4444', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>오답</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                    정답: <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{quiz.answer}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Submit button */}
          {!shortSubmitted && (
            <div style={{ marginTop: 'auto', paddingTop: 8 }}>
              <button
                onClick={handleShortSubmit}
                disabled={!shortText.trim()}
                style={{
                  width: '100%', height: 52, border: 'none', borderRadius: 14,
                  backgroundColor: shortText.trim() ? '#C9A84C' : 'rgba(201,168,76,0.3)',
                  color: shortText.trim() ? '#0F0F1A' : 'rgba(255,255,255,0.3)',
                  fontSize: 16, fontWeight: 700,
                  cursor: shortText.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                제출하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizScreen;
