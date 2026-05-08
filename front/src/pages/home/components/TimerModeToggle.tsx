import React from 'react';

export type TimerMode = 'normal' | 'pomodoro';

interface TimerModeToggleProps {
  timerMode: TimerMode;
  onSwitchMode: (mode: TimerMode) => void;
}

const TimerModeToggle: React.FC<TimerModeToggleProps> = ({ timerMode, onSwitchMode }) => {
  return (
    <div
      style={{
        display: 'flex',
        backgroundColor: '#1A1A2E',
        borderRadius: 24,
        padding: 4,
        marginBottom: 32,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {(['normal', 'pomodoro'] as const).map((mode) => {
        const active = timerMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onSwitchMode(mode)}
            style={{
              height: 36,
              padding: '0 20px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: active ? '#C9A84C' : 'transparent',
              color: active ? '#0F0F1A' : 'rgba(255,255,255,0.45)',
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 200ms ease',
              letterSpacing: '-0.2px',
            }}
          >
            {mode === 'normal' ? '일반' : '🍅 포모도로'}
          </button>
        );
      })}
    </div>
  );
};

export default TimerModeToggle;
