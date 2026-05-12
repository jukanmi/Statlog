import React from 'react';

interface TimerActionButtonsProps {
  isActive: boolean;
  isStudying: boolean;
  isBreak: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

const TimerActionButtons: React.FC<TimerActionButtonsProps> = ({
  isActive,
  isStudying,
  isBreak,
  onStart,
  onPause,
  onStop,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 56,
      }}
    >
      {!isActive ? (
        <button
          onClick={onStart}
          style={{
            width: 200,
            height: 56,
            backgroundColor: isBreak ? '#A78BFA' : '#C9A84C',
            border: 'none',
            borderRadius: 28,
            color: isBreak ? '#FFFFFF' : '#0F0F1A',
            fontSize: 18,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: isBreak
              ? '0 0 24px rgba(167,139,250,0.4)'
              : '0 0 24px rgba(201,168,76,0.4)',
            transition: 'transform 150ms ease, box-shadow 150ms ease',
            letterSpacing: '-0.3px',
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          {isBreak ? '휴식 시작' : '시작하기'}
        </button>
      ) : (
        <>
          <button
            onClick={isStudying ? onPause : onStart}
            style={{
              width: 140,
              height: 56,
              backgroundColor: 'transparent',
              border: `1.5px solid ${isBreak ? '#A78BFA' : '#C9A84C'}`,
              borderRadius: 28,
              color: isBreak ? '#A78BFA' : '#C9A84C',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 150ms ease, transform 150ms ease',
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            {isStudying ? '일시정지' : '재개'}
          </button>

          <button
            onClick={onStop}
            style={{
              width: 140,
              height: 56,
              backgroundColor: '#C9A84C',
              border: 'none',
              borderRadius: 28,
              color: '#0F0F1A',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(201,168,76,0.35)',
              transition: 'transform 150ms ease, box-shadow 150ms ease',
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            완료
          </button>
        </>
      )}
    </div>
  );
};

export default TimerActionButtons;
