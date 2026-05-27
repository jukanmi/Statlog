import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useStudyStore } from '@/store/useStudyStore';

interface Props {
  streak: number;
  onClose: () => void;
}

const StreakBonusModal: React.FC<Props> = ({ streak, onClose }) => {
  const addStats = useUserStore((s) => s.addStats);
  const clearStreakBonus = useStudyStore((s) => s.clearStreakBonus);
  const [claimed, setClaimed] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleClaim = () => {
    addStats({ END: 3 });
    clearStreakBonus();
    setClaimed(true);
  };

  const handleClose = () => {
    if (!claimed) clearStreakBonus();
    onClose();
  };

  const daysToShow = Math.min(streak, 7);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 300,
      padding: '0 24px',
    }}>
      <div style={{
        backgroundColor: '#1A1A2E',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 340,
        textAlign: 'center',
        boxShadow: '0 0 60px rgba(201,168,76,0.15)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12, lineHeight: 1 }}>
          {claimed ? '🏆' : '🔥'}
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
          {streak}일 연속 학습!
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
          끈기 있는 학습으로 특별 보너스를 획득했어요
        </div>

        {/* Streak dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const filled = i < daysToShow;
            return (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: filled && animated
                    ? (i === 6 ? '#C9A84C' : 'rgba(201,168,76,0.5)')
                    : 'rgba(255,255,255,0.08)',
                  border: filled ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: filled ? '#0F0F1A' : 'rgba(255,255,255,0.3)',
                  fontWeight: 700,
                  transition: `background-color 300ms ease ${i * 60}ms`,
                  boxShadow: filled && animated && i === 6 ? '0 0 16px rgba(201,168,76,0.5)' : 'none',
                }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* Bonus display */}
        <div style={{
          backgroundColor: 'rgba(167,139,250,0.08)',
          border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
            끈기 보너스
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>지구력 (END)</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#A78BFA' }}>+3</span>
          </div>
        </div>

        {!claimed ? (
          <button
            onClick={handleClaim}
            style={{
              width: '100%', height: 52, backgroundColor: '#C9A84C', border: 'none',
              borderRadius: 14, color: '#0F0F1A', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 0 20px rgba(201,168,76,0.35)',
            }}
          >
            보너스 받기
          </button>
        ) : (
          <button
            onClick={handleClose}
            style={{
              width: '100%', height: 52, backgroundColor: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 14,
              color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}
          >
            확인
          </button>
        )}
      </div>
    </div>
  );
};

export default StreakBonusModal;
