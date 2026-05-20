import { useState, useEffect } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import type { QuizType } from '@/types';

const SUBJECTS = ['수학', '영어', '과학', '국어', '사회', '프로그래밍', '기타'] as const;

interface QuizCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#0F0F1A',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '12px 14px',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
};

function FieldLabel({ text, required, sub }: { text: string; required?: boolean; sub?: string }) {
  return (
    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
      {text}
      {required && <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>}
      {sub && <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginLeft: 6 }}>{sub}</span>}
    </div>
  );
}

const QuizCreateModal: React.FC<QuizCreateModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [subject, setSubject] = useState('수학');
  const [quizType, setQuizType] = useState<QuizType>('multiple');

  // Step 2 - common
  const [question, setQuestion] = useState('');

  // Step 2 - multiple choice
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null);

  // Step 2 - short answer
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');

  const addQuiz = useQuizStore((s) => s.addQuiz);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 16);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        setMounted(false);
        resetForm();
      }, 320);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep(1);
    setSubject('수학');
    setQuizType('multiple');
    setQuestion('');
    setOptions(['', '']);
    setCorrectOptionIndex(null);
    setAnswer('');
    setHint('');
  };

  if (!mounted) return null;

  const updateOption = (i: number, val: string) => {
    const next = [...options];
    next[i] = val.slice(0, 40);
    setOptions(next);
  };

  const addOption = () => {
    if (options.length < 4) setOptions([...options, '']);
  };

  const removeOption = (i: number) => {
    const next = options.filter((_, idx) => idx !== i);
    setOptions(next);
    if (correctOptionIndex === i) setCorrectOptionIndex(null);
    else if (correctOptionIndex !== null && correctOptionIndex > i)
      setCorrectOptionIndex(correctOptionIndex - 1);
  };

  const canSave =
    quizType === 'multiple'
      ? question.trim().length > 0 &&
        options.every((o) => o.trim().length > 0) &&
        correctOptionIndex !== null
      : question.trim().length > 0 && answer.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    if (quizType === 'multiple') {
      addQuiz({
        subject,
        type: 'multiple',
        question: question.trim(),
        options: options.map((o) => o.trim()),
        correctIndex: correctOptionIndex!,
      });
    } else {
      addQuiz({
        subject,
        type: 'short',
        question: question.trim(),
        answer: answer.trim(),
        hint: hint.trim() || undefined,
      });
    }
    onClose();
    onCreated();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backgroundColor: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        transition: 'background-color 300ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 430,
          backgroundColor: '#1A1A2E',
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 300ms ease',
          maxHeight: '90dvh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 40, height: 4, background: 'rgba(255,255,255,0.15)',
            borderRadius: 2, margin: '0 auto 20px',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>퀴즈 만들기</div>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[1, 2].map((n) => (
              <div
                key={n}
                style={{
                  width: n === step ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    n === step
                      ? '#C9A84C'
                      : n < step
                        ? 'rgba(201,168,76,0.4)'
                        : 'rgba(255,255,255,0.12)',
                  transition: 'all 300ms ease',
                }}
              />
            ))}
          </div>
        </div>

        {step === 1 ? (
          /* ── Step 1: 과목 + 유형 ── */
          <div>
            <FieldLabel text="과목 선택" required />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  style={{
                    borderRadius: 20, padding: '7px 16px', fontSize: 14, cursor: 'pointer',
                    border: subject === s ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    background: subject === s ? '#C9A84C' : '#0F0F1A',
                    color: subject === s ? '#0F0F1A' : 'rgba(255,255,255,0.5)',
                    fontWeight: subject === s ? 700 : 400,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <FieldLabel text="문제 유형" required />
            <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
              {(['multiple', 'short'] as QuizType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setQuizType(t)}
                  style={{
                    flex: 1, height: 52, borderRadius: 14, cursor: 'pointer',
                    border: quizType === t ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    background: quizType === t ? 'rgba(201,168,76,0.12)' : '#0F0F1A',
                    color: quizType === t ? '#C9A84C' : 'rgba(255,255,255,0.5)',
                    fontSize: 15, fontWeight: quizType === t ? 700 : 400,
                  }}
                >
                  {t === 'multiple' ? '객관식' : '주관식'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%', height: 52, borderRadius: 14, border: 'none',
                background: '#C9A84C', color: '#0F0F1A', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              }}
            >
              다음
            </button>
          </div>
        ) : (
          /* ── Step 2: 문제 작성 ── */
          <div>
            <FieldLabel text="질문" required />
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 100))}
              placeholder="문제를 입력하세요"
              rows={3}
              style={{
                ...inputStyle,
                resize: 'none',
                fontFamily: 'inherit',
                marginBottom: 4,
                display: 'block',
              }}
            />
            <div
              style={{
                color: 'rgba(255,255,255,0.3)', fontSize: 11,
                textAlign: 'right', marginBottom: 20,
              }}
            >
              {question.length}/100
            </div>

            {quizType === 'multiple' ? (
              /* 객관식 */
              <div>
                <FieldLabel text="선택지" sub="(원을 눌러 정답 지정)" required />
                {options.map((opt, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
                  >
                    {/* 정답 라디오 */}
                    <button
                      onClick={() => setCorrectOptionIndex(i)}
                      title="정답으로 설정"
                      style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        border: correctOptionIndex === i ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                        background: correctOptionIndex === i ? '#C9A84C' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {correctOptionIndex === i && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="#0F0F1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    <input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`선택지 ${i + 1}`}
                      style={{ ...inputStyle, flex: 1 }}
                    />

                    {options.length > 2 && (
                      <button
                        onClick={() => removeOption(i)}
                        style={{
                          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                          border: 'none', background: 'rgba(239,68,68,0.1)',
                          color: '#EF4444', cursor: 'pointer', fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {options.length < 4 && (
                  <button
                    onClick={addOption}
                    style={{
                      width: '100%', height: 40, borderRadius: 10, cursor: 'pointer',
                      border: '1px dashed rgba(255,255,255,0.15)',
                      background: 'transparent', color: 'rgba(255,255,255,0.4)',
                      fontSize: 13, marginTop: 4, marginBottom: 4,
                    }}
                  >
                    + 선택지 추가
                  </button>
                )}
              </div>
            ) : (
              /* 주관식 */
              <div>
                <FieldLabel text="정답" required />
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value.slice(0, 50))}
                  placeholder="정답을 입력하세요"
                  style={{ ...inputStyle, display: 'block', marginBottom: 20 }}
                />

                <FieldLabel text="힌트" sub="(선택)" />
                <input
                  value={hint}
                  onChange={(e) => setHint(e.target.value.slice(0, 50))}
                  placeholder="힌트를 입력하세요 (선택)"
                  style={{ ...inputStyle, display: 'block', marginBottom: 8 }}
                />
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  width: 80, height: 52, borderRadius: 14, cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 15,
                }}
              >
                이전
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                style={{
                  flex: 1, height: 52, borderRadius: 14, border: 'none',
                  background: canSave ? '#C9A84C' : 'rgba(201,168,76,0.3)',
                  color: canSave ? '#0F0F1A' : 'rgba(255,255,255,0.3)',
                  fontSize: 16, fontWeight: 700,
                  cursor: canSave ? 'pointer' : 'not-allowed',
                }}
              >
                저장하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizCreateModal;
