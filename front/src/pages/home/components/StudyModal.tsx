import React, { useState, useEffect } from 'react';
import type { StudySession } from '@/types';
import { syncUserToServer, encodeBitmask } from '@/lib/api';
import { useStudyStore } from '@/store/useStudyStore';
import { useUserStore } from '@/store/useUserStore';
import { generateQuiz, type Quiz } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface StudyModalProps {
  isOpen: boolean;
  elapsedSeconds: number;
  formattedElapsed: string;
  onSave: () => void;
  onClose: () => void;
}

const SUBJECTS = ['수학', '영어', '과학', '국어', '사회', '프로그래밍', '기타'] as const;

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
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const addSession = useStudyStore((s) => s.addSession);
  const setLastSessionStats = useStudyStore((s) => s.setLastSessionStats);
  const setLastSessionQuiz = useStudyStore((s) => s.setLastSessionQuiz);

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

  const handleSave = async () => {
    if (!content.trim()) {
      alert('학습 내용을 입력해주세요!');
      return;
    }

    setIsGenerating(true);
    let aiQuiz: Quiz[] | undefined;

    try {
      const quizResult = await generateQuiz(content);
      aiQuiz = quizResult;
    } catch (error) {
      console.error('generateQuiz 실패:', error);
      alert('AI 처리에 실패하여 기본 퀴즈로 대체합니다.');
    } finally {
      setIsGenerating(false);
    }

    // 2. Save session to DB (stat_gained는 퀴즈 정답 후 별도 요청)
    const session: StudySession = {
      id: crypto.randomUUID(),
      subject,
      content,
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      date: new Date().toISOString().split('T')[0],
      statGained: {},
      aiStatGained: undefined,
    };

    if (useUserStore.getState().dataCollectionConsent) {
      fetch(import.meta.env.VITE_API_URL + '/api/v1/analytics/study-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_minutes: session.durationMinutes,
          subject: session.subject,
          timestamp: new Date().toISOString(),
        })
      }).catch(err => console.error('Failed to send anonymous analytics:', err));
    }

    // 3. 퀴즈 저장, 스탯은 퀴즈 정답 후 요청하므로 null로 초기화
    setLastSessionStats(null);
    setLastSessionQuiz(aiQuiz || null);
    addSession(session);  // ← 여기서 studyStreak 업데이트됨

    // 4. addSession 이후 최신 studyStreak 읽기
    const { ownedCharacterIds, equippedCharacterId, characterExpMap } = useUserStore.getState();
    const { studyStreak } = useStudyStore.getState();
    syncUserToServer({
      study_streak: studyStreak,
      owned_characters_bits: encodeBitmask(ownedCharacterIds),
      equipped_character_id: equippedCharacterId,
      character_exp_map: characterExpMap,
    });

    setContent('');
    setSubject('수학');
    onSave();
  };

  return (
    <div
      onClick={isGenerating ? undefined : onClose}
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
          boxSizing: 'border-box',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            무슨 공부를 했나요?
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isGenerating}
            style={{
              boxSizing: 'border-box',
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
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
              opacity: isGenerating ? 0.6 : 1,
            }}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s} style={{ backgroundColor: '#1A1A2E' }}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Content textarea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            학습 내용을 간단히 적어주세요
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setTextareaFocused(true)}
            onBlur={() => setTextareaFocused(false)}
            disabled={isGenerating}
            placeholder="오늘 배운 내용을 입력하세요..."
            rows={3}
            style={{
              boxSizing: 'border-box',
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
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
              opacity: isGenerating ? 0.6 : 1,
            }}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isGenerating}
          style={{
            width: '100%',
            height: 52,
            backgroundColor: '#C9A84C',
            border: 'none',
            borderRadius: 14,
            color: '#0F0F1A',
            fontSize: 16,
            fontWeight: 700,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            marginTop: 4,
            transition: 'opacity 150ms ease, transform 150ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onMouseDown={(e) => {
            if (isGenerating) return;
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            if (isGenerating) return;
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              AI 분석 중...
            </>
          ) : (
            '기록 저장하기'
          )}
        </button>
      </div>
    </div>
  );
};

export default StudyModal;
