import { useUserStore } from '@/store/useUserStore';

interface BurnoutWarningModalProps {
  todayMinutes: number;
  onClose: () => void;
  onAcceptRest: () => void;
}

const BurnoutWarningModal: React.FC<BurnoutWarningModalProps> = ({
  todayMinutes,
  onClose,
  onAcceptRest,
}) => {
  const { user, updateCurrency } = useUserStore();
  const hours = Math.floor(todayMinutes / 60);
  const mins = todayMinutes % 60;

  const handleAcceptRest = () => {
    // 휴식 수락 시 소정의 보상 지급
    updateCurrency(user.gold + 50, user.gems + 1);
    onAcceptRest();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px',
    }}>
      <div style={{
        background: '#1A1A2E',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 24, padding: 28, maxWidth: 360, width: '100%',
        textAlign: 'center',
        boxShadow: '0 0 40px rgba(239,68,68,0.1)',
      }}>
        {/* Icon */}
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔥</div>

        {/* Title */}
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          번아웃 주의!
        </div>

        {/* Body */}
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          오늘 {hours}시간{mins > 0 ? ` ${mins}분` : ''} 이상 공부했어요.<br />
          잠깐 쉬는 것도 중요해요. 휴식을 취하면<br />
          더 효율적으로 학습할 수 있어요.
        </div>

        {/* Rest reward notice */}
        <div style={{
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>🎁</span>
          <span style={{ color: '#C9A84C', fontSize: 13, fontWeight: 600 }}>
            휴식 수락 시 골드 50 + 젬 1 지급
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, height: 48, borderRadius: 12, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14,
            }}
          >
            계속 공부할게요
          </button>
          <button
            onClick={handleAcceptRest}
            style={{
              flex: 1, height: 48, borderRadius: 12, cursor: 'pointer',
              border: 'none',
              background: 'linear-gradient(135deg, #C9A84C, #E8CC7A)',
              color: '#000', fontSize: 14, fontWeight: 700,
            }}
          >
            휴식 취하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default BurnoutWarningModal;
