import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStudyStore } from '@/store/useStudyStore';
import { useUserStore } from '@/store/useUserStore';
import { generateQuiz } from '@/lib/api';
import type { StudySession } from '@/types';
import type { Quiz } from '@/lib/api';
import { Loader2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { getRandomTip } from '@/constants/studyTips';

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
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [subject, setSubject] = useState<string>('수학');
  const [content, setContent] = useState('');
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [currentTip, setCurrentTip] = useState(getRandomTip());

  const addSession = useStudyStore((s) => s.addSession);
  const setLastSessionStats = useStudyStore((s) => s.setLastSessionStats);
  const setLastSessionQuiz = useStudyStore((s) => s.setLastSessionQuiz);

  // Loading steps for progressive UI
  const loadingMessages = [
    '학습 데이터 추출 중...',
    '6대 능력치 분석 중...',
    '복습 퀴즈 생성 중...',
    '거의 다 되었어요!'
  ];

  // --- 낙관적 업데이트를 적용한 Mutation ---
  const saveMutation = useMutation({
    mutationFn: async () => {
      // 퀴즈 생성 (stats는 StatUpdateScreen에서 별도 계산)
      const aiQuiz = await generateQuiz(content);
      return { aiStats: null, aiQuiz };
    },
    
    // 1. Mutate 시작 시 호출 (낙관적 업데이트 로직)
    onMutate: async () => {
      // 관련 쿼리 취소 (진행 중인게 있다면)
      await queryClient.cancelQueries({ queryKey: ['study-history'] });

      // 이전 상태 스냅샷 저장 (롤백용)
      const previousSessions = useStudyStore.getState().sessions;
      const previousTodayMinutes = useStudyStore.getState().todayMinutes;

      // 낙관적으로 스토어 미리 업데이트 (세션 추가)
      const optimisticSession: StudySession = {
        id: `temp-${crypto.randomUUID()}`,
        subject,
        content,
        durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
        date: new Date().toISOString().split('T')[0],
        statGained: {},
        // 분석 전이므로 aiStatGained는 일단 비워둠 (UI에서 '분석중' 표시 가능)
      };
      
      addSession(optimisticSession);

      // 스냅샷 반환
      return { previousSessions, previousTodayMinutes };
    },

    // 2. 성공 시 호출
    onSuccess: ({ aiStats: _aiStats, aiQuiz }) => {
      // AI 결과 확인 및 알림
      if (aiQuiz && aiQuiz[0]?.question.includes('[timeout]')) {
        toast.warning('서버 보호 모드 작동 중: 임시 퀴즈가 제공됩니다.');
      } else {
        toast.success('학습 기록 분석이 완료되었습니다!');
      }

      // stats는 StatUpdateScreen에서 별도 계산, 퀴즈만 저장
      setLastSessionStats(null);
      setLastSessionQuiz(aiQuiz || null);

      // 익명 분석 데이터 전송
      if (useUserStore.getState().dataCollectionConsent) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        fetch(baseUrl + '/api/v1/analytics/study-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration_minutes: Math.max(1, Math.round(elapsedSeconds / 60)),
            subject: subject,
            timestamp: new Date().toISOString(),
          })
        }).catch(err => console.error('Failed to send anonymous analytics:', err));
      }

      // 폼 초기화 및 닫기
      setContent('');
      setSubject('수학');
      onSave();
    },

    // 3. 에러 발생 시 호출 (롤백)
    onError: (err, variables, context) => {
      console.error('saveMutation error:', err);
      
      // 롤백 로직: 스냅샷을 사용하여 이전 상태로 복구
      // (현재 zustand persist 구조상 복잡할 수 있으나, 개념적으로 temp 세션을 제거)
      const currentSessions = useStudyStore.getState().sessions;
      const filteredSessions = currentSessions.filter(s => !s.id.startsWith('temp-'));
      
      useStudyStore.setState({ 
        sessions: filteredSessions,
        // todayMinutes 등은 간단하게 다시 계산하거나 저장된 컨텍스트 사용
        todayMinutes: context?.previousTodayMinutes ?? useStudyStore.getState().todayMinutes
      });

      toast.error('저장에 실패하여 기록이 취소되었습니다.');
    },

    // 4. 완료 후 (성공/실패 무관)
    onSettled: () => {
      // 필요 시 쿼리 무효화 (서버 데이터 싱크용)
      queryClient.invalidateQueries({ queryKey: ['study-history'] });
    }
  });

  const isGenerating = saveMutation.isPending;

  useEffect(() => {
    let interval: any;
    let tipInterval: any;
    if (isGenerating) {
      setLoadingStep(0);
      setCurrentTip(getRandomTip());
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 2500);

      tipInterval = setInterval(() => {
        setCurrentTip(getRandomTip());
      }, 5000);
    }
    return () => {
      clearInterval(interval);
      clearInterval(tipInterval);
    };
  }, [isGenerating]);

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
    if (!content.trim()) {
      toast.error('학습 내용을 입력해주세요!');
      return;
    }
    saveMutation.mutate();
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

        {/* Save button & Loading Tip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
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
                {loadingMessages[loadingStep]}
              </>
            ) : (
              '기록 저장하기'
            )}
          </button>

          {isGenerating && (
            <div
              style={{
                backgroundColor: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.15)',
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                gap: 10,
                animation: 'fadeIn 300ms ease-out',
              }}
            >
              <Lightbulb size={18} style={{ color: '#C9A84C', flexShrink: 0, marginTop: 1 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Study Tip
                </span>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5, animation: 'tipIn 500ms ease-out' }} key={currentTip}>
                  {currentTip}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tipIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default StudyModal;
