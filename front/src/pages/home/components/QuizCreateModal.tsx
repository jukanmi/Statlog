import { useState, useEffect } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import type { QuizType } from '@/types';
import { generateQuiz } from '@/lib/api';

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
  
  // Modes
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [step, setStep] = useState<1 | 2>(1);

  // Common
  const [subject, setSubject] = useState('수학');

  // Manual Mode States
  const [quizType, setQuizType] = useState<QuizType>('multiple');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');

  // AI Mode States
  const [aiContent, setAiContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
    setMode('manual');
    setStep(1);
    setSubject('수학');
    setQuizType('multiple');
    setQuestion('');
    setOptions(['', '']);
    setCorrectOptionIndex(null);
    setAnswer('');
    setHint('');
    setAiContent('');
    setIsGenerating(false);
  };

  if (!mounted) return null;

  // Manual Mode Functions
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

  const canSaveManual =
    quizType === 'multiple'
      ? question.trim().length > 0 &&
        options.every((o) => o.trim().length > 0) &&
        correctOptionIndex !== null
      : question.trim().length > 0 && answer.trim().length > 0;

  const handleSaveManual = () => {
    if (!canSaveManual) return;
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

  // AI Mode Functions
  const handleAiGenerate = async () => {
    if (!aiContent.trim()) return;
    setIsGenerating(true);
    try {
      const generatedQuizzes = await generateQuiz(aiContent);
      generatedQuizzes.forEach((q) => {
        addQuiz({
          subject,
          type: 'multiple',
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
        });
      });
      onClose();
      onCreated();
    } catch (error) {
      console.error('AI 퀴즈 생성 실패:', error);
      alert('퀴즈 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const SubjectSelector = () => (
    <div style={{ marginBottom: 28 }}>
      <FieldLabel text="과목 선택" required />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
    </div>
  );

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>퀴즈 만들기</div>
          {/* Step indicator (only for manual) */}
          {mode === 'manual' && (
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
          )}
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 14 }}>
          <button
            onClick={() => setMode('manual')}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              background: mode === 'manual' ? '#0F0F1A' : 'transparent',
              color: mode === 'manual' ? '#fff' : 'rgba(255,255,255,0.5)',
              border: 'none', fontWeight: 600, cursor: 'pointer',
              boxShadow: mode === 'manual' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            직접 만들기
          </button>
          <button
            onClick={() => setMode('ai')}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              background: mode === 'ai' ? '#0F0F1A' : 'transparent',
              color: mode === 'ai' ? '#C9A84C' : 'rgba(255,255,255,0.5)',
              border: 'none', fontWeight: 600, cursor: 'pointer',
              boxShadow: mode === 'ai' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            AI 자동 생성 ✨
          </button>
        </div>

        {mode === 'manual' ? (
          /* ================= MANUAL MODE ================= */
          step === 1 ? (
            /* ── Step 1: 과목 + 유형 ── */
            <div>
              <SubjectSelector />

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
                  onClick={handleSaveManual}
                  disabled={!canSaveManual}
                  style={{
                    flex: 1, height: 52, borderRadius: 14, border: 'none',
                    background: canSaveManual ? '#C9A84C' : 'rgba(201,168,76,0.3)',
                    color: canSaveManual ? '#0F0F1A' : 'rgba(255,255,255,0.3)',
                    fontSize: 16, fontWeight: 700,
                    cursor: canSaveManual ? 'pointer' : 'not-allowed',
                  }}
                >
                  저장하기
                </button>
              </div>
            </div>
          )
        ) : (
          /* ================= AI MODE ================= */
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <SubjectSelector />
            
            <FieldLabel text="학습 내용" required sub="(복사해둔 노트를 붙여넣어주세요)" />
            <textarea
              value={aiContent}
              onChange={(e) => setAiContent(e.target.value)}
              placeholder="예) 오늘 배운 React의 useState와 useEffect 훅에 대해 설명..."
              rows={5}
              style={{
                ...inputStyle,
                resize: 'none',
                fontFamily: 'inherit',
                marginBottom: 24,
                display: 'block',
              }}
            />

            <button
              onClick={handleAiGenerate}
              disabled={isGenerating || aiContent.trim().length < 5}
              style={{
                width: '100%', height: 52, borderRadius: 14, border: 'none',
                background: (isGenerating || aiContent.trim().length < 5) ? 'rgba(201,168,76,0.3)' : '#C9A84C',
                color: (isGenerating || aiContent.trim().length < 5) ? 'rgba(255,255,255,0.3)' : '#0F0F1A',
                fontSize: 16, fontWeight: 700,
                cursor: (isGenerating || aiContent.trim().length < 5) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                  AI가 문제를 생성하고 있어요...
                </>
              ) : 'AI 객관식 문제 생성하기'}
            </button>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 12 }}>
              AI가 내용을 분석하여 자동으로 문제를 만들어 퀴즈 목록에 추가합니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizCreateModal;