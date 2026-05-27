import React, { useState, useEffect } from 'react';

interface QuestGoalModalProps {
  isOpen: boolean;
  initialMinutes: number;
  initialSubject: string;
  onSave: (minutes: number, subject: string) => void;
  onClose: () => void;
}

const QuestGoalModal: React.FC<QuestGoalModalProps> = ({
  isOpen,
  initialMinutes,
  initialSubject,
  onSave,
  onClose,
}) => {
  const [minutes, setMinutes] = useState(initialMinutes.toString());
  const [subject, setSubject] = useState(initialSubject);

  useEffect(() => {
    if (isOpen) {
      setMinutes(initialMinutes.toString());
      setSubject(initialSubject);
    }
  }, [isOpen, initialMinutes, initialSubject]);

  if (!isOpen) return null;

  const handleSave = () => {
    const val = parseInt(minutes, 10);
    if (!isNaN(val) && val > 0 && val <= 1440) {
      const finalSubject = subject.trim() || '자유 학습';
      onSave(val, finalSubject);
      onClose();
    } else {
      alert('1에서 1440 사이의 올바른 숫자를 입력해주세요.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          backgroundColor: '#1C1C28',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 320,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <h2 style={{ margin: 0, color: '#fff', fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
          일일 퀘스트 목표 설정
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 }}>
            공부 주제 / 내용
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="예: 수학, 코딩 등"
            style={{
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '10px 12px',
              color: '#fff',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 }}>
            목표 시간 (분)
          </label>
          <input
            type="number"
            min="1"
            max="1440"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '10px 12px',
              color: '#fff',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#C9A84C',
              color: '#13131A',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestGoalModal;
