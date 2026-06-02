import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface QuizReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const QuizReportModal: React.FC<QuizReportModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

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

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(reason);
    setReason('');
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        backgroundColor: visible ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
        transition: 'background-color 300ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 360,
          backgroundColor: '#1A1A2E',
          borderRadius: 24, padding: 24,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          transform: visible ? 'scale(1)' : 'scale(0.9)',
          opacity: visible ? 1 : 0,
          transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer', padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: 'rgba(239,68,68,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#EF4444', margin: '0 auto 16px',
        }}>
          <AlertCircle size={32} />
        </div>

        <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
          퀴즈 신고하기
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
          문제가 있는 퀴즈인가요? 신고해 주시면<br />검토 후 조치하겠습니다.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="신고 사유를 입력해 주세요 (예: 오답, 중복, 부적절한 내용 등)"
          style={{
            width: '100%', height: 100,
            backgroundColor: '#0F0F1A', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: 14, color: '#fff', fontSize: 14,
            outline: 'none', resize: 'none', marginBottom: 20,
            boxSizing: 'border-box', fontFamily: 'inherit',
          }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, height: 48, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim()}
            style={{
              flex: 1, height: 48, borderRadius: 12, border: 'none',
              background: '#EF4444', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: reason.trim() ? 'pointer' : 'not-allowed',
              opacity: reason.trim() ? 1 : 0.5,
            }}
          >
            신고하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizReportModal;
