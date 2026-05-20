import { useState, useEffect } from 'react';
import { useStudyStore } from '@/store/useStudyStore';
import type { StudySession, StudyDepth } from '@/types';

interface StudyModalProps {
  isOpen: boolean;
  elapsedSeconds: number;
  formattedElapsed: string;
  onSave: (depth: StudyDepth) => void;
  onClose: () => void;
}

const SUBJECTS = ['수학', '영어', '과학', '국어', '사회', '프로그래밍', '기타'] as const;

const DEPTH_OPTIONS: { value: StudyDepth; label: string; desc: string; multiplier: string }[] = [
  { value: 'memorize', label: '암기', desc: '내용을 외웠어요', multiplier: 'x1.0' },
  { value: 'understand', label: '이해', desc: '개념을 이해했어요', multiplier: 'x1.2' },
  { value: 'apply', label: '응용', desc: '응용까지 했어요', multiplier: 'x1.5' },
];

const StudyModal: React.FC<StudyModalProps> = ({
  isOpen,
  elapsedSeconds,
  formattedElapsed,
  onSave,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [subject, setSubject] = useState<string>('수학');
  const [content, setContent] = useState('');
  const [depth, setDepth] = useState<StudyDepth>('understand');
  const [textareaFocused, setTextareaFocused] = useState(false);
  const addSession = useStudyStore((s) => s.addSession);

  // Mount → next tick → slide up
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 16);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const handleSave = () => {
    const session: StudySession = {
      id: Date.now().toString(),
      subject,
      content,
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      date: new Date().toISOString().split('T')[0],
      statGained: {},
      depth,
    };
    addSession(session);
    setContent('');
    setSubject('수학');
    setDepth('understand');
    onSave(depth);
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
          padding: '24px 24px calc(24px + env(safe-area-inset-bottom))',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 300ms ease',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Header */}
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            학습을 완료했어요! 🎉
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.45)',
              marginTop: 6,
            }}
          >
            총 {formattedElapsed} 동안 집중했어요
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

        {/* Subject select */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            무슨 공부를 했나요?
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#0F0F1A',
              border: '1.5px solid #C9A84C',
              borderRadius: 10,
              color: '#FFFFFF',
              padding: '12px 14px',
              fontSize: 15,
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23C9A84C' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
              paddingRight: 40,
            }}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s} style={{ backgroundColor: '#1A1A2E' }}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Depth selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            학습 깊이
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {DEPTH_OPTIONS.map((opt) => {
              const active = depth === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setDepth(opt.value)}
                  style={{
                    flex: 1,
                    height: 56,
                    borderRadius: 12,
                    border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: active ? 'rgba(201,168,76,0.12)' : '#0F0F1A',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    outline: active ? '1.5px solid rgba(201,168,76,0.5)' : 'none',
                    transition: 'all 150ms ease',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: active ? '#C9A84C' : 'rgba(255,255,255,0.6)' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: 10, color: active ? 'rgba(201,168,76,0.7)' : 'rgba(255,255,255,0.3)' }}>
                    {opt.multiplier}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content textarea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            학습 내용을 간단히 적어주세요
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setTextareaFocused(true)}
            onBlur={() => setTextareaFocused(false)}
            placeholder="오늘 배운 내용을 입력하세요..."
            rows={3}
            style={{
              width: '100%',
              backgroundColor: '#0F0F1A',
              border: `1.5px solid ${textareaFocused ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10,
              color: '#FFFFFF',
              padding: '12px 14px',
              fontSize: 15,
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 200ms ease',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
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
            marginTop: 4,
            transition: 'opacity 150ms ease, transform 150ms ease',
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          기록 저장하기
        </button>
      </div>
    </div>
  );
};

export default StudyModal;
