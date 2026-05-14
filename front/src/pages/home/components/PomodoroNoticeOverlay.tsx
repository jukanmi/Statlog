import React from 'react';

export type PomodoroNotice = 'study-done' | 'break-done' | null;

interface PomodoroNoticeOverlayProps {
  pomNotice: PomodoroNotice;
  pomRound: number;
  onBreakStart: () => void;
  onNextRound: () => void;
  onComplete: () => void;
}

const PomodoroNoticeOverlay: React.FC<PomodoroNoticeOverlayProps> = ({
  pomNotice,
  pomRound,
  onBreakStart,
  onNextRound,
  onComplete,
}) => {
  if (!pomNotice) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#1A1A2E',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: '28px 28px 24px',
        textAlign: 'center',
        zIndex: 10,
        minWidth: 270,
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 10 }}>
        {pomNotice === 'study-done' ? '🍅' : '☕'}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
        {pomNotice === 'study-done' ? `${pomRound}라운드 완료!` : '휴식 완료!'}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 22 }}>
        {pomNotice === 'study-done'
          ? pomRound >= 4
            ? '15분 긴 휴식을 취하세요'
            : '5분 휴식을 취하세요'
          : pomRound < 4
            ? '다음 라운드를 시작하세요'
            : '4라운드 모두 완료했어요!'}
      </div>

      {pomNotice === 'study-done' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onBreakStart}
            style={{
              height: 44,
              backgroundColor: '#A78BFA',
              border: 'none',
              borderRadius: 12,
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {pomRound >= 4 ? '15분 휴식하기' : '5분 휴식하기'}
          </button>
          <button
            onClick={onComplete}
            style={{
              height: 40,
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            오늘 학습 완료
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pomRound < 4 && (
            <button
              onClick={onNextRound}
              style={{
                height: 44,
                backgroundColor: '#C9A84C',
                border: 'none',
                borderRadius: 12,
                color: '#0F0F1A',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              다음 라운드 시작
            </button>
          )}
          <button
            onClick={onComplete}
            style={{
              height: pomRound >= 4 ? 44 : 40,
              backgroundColor: pomRound >= 4 ? '#C9A84C' : 'transparent',
              border: pomRound >= 4 ? 'none' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              color: pomRound >= 4 ? '#0F0F1A' : 'rgba(255,255,255,0.5)',
              fontSize: pomRound >= 4 ? 14 : 13,
              fontWeight: pomRound >= 4 ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            학습 완료
          </button>
        </div>
      )}
    </div>
  );
};

export default PomodoroNoticeOverlay;
