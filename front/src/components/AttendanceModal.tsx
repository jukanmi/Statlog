import { useState } from 'react';
import { useUserStore, type AttendanceReward } from '@/store/useUserStore';

interface Props {
  onClose: () => void;
}

const DAILY_REWARD: AttendanceReward = { gold: 100, gems: 1 };

const AttendanceModal: React.FC<Props> = ({ onClose }) => {
  const claimAttendance = useUserStore((s) => s.claimAttendance);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    claimAttendance();
    setClaimed(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '0 24px',
      }}
    >
      <div
        style={{
          backgroundColor: '#1A1A2E',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: 32,
          width: '100%',
          maxWidth: 340,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>

        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
          출석 보상
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
          오늘도 접속했군요!
        </div>

        {/* Reward display */}
        <div
          style={{
            backgroundColor: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
            display: 'flex',
            gap: 24,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🪙</span>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#C9A84C' }}>+{DAILY_REWARD.gold}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>💎</span>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#A78BFA' }}>+{DAILY_REWARD.gems}</span>
          </div>
        </div>

        {!claimed ? (
          <button
            onClick={handleClaim}
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
              boxShadow: '0 0 20px rgba(201,168,76,0.35)',
            }}
          >
            받기
          </button>
        ) : (
          <button
            onClick={onClose}
            style={{
              width: '100%',
              height: 52,
              backgroundColor: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.15)',
              borderRadius: 14,
              color: 'rgba(255,255,255,0.7)',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            확인
          </button>
        )}
      </div>
    </div>
  );
};

export default AttendanceModal;
