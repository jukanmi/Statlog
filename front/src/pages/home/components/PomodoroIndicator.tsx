import React from 'react';

interface PomodoroIndicatorProps {
  pomRound: number;
  isBreak: boolean;
}

const PomodoroIndicator: React.FC<PomodoroIndicatorProps> = ({ pomRound, isBreak }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
        backgroundColor: '#1A1A2E',
        borderRadius: 20,
        padding: '8px 16px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span style={{ fontSize: 14 }}>{isBreak ? '☕' : '🍅'}</span>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
        {pomRound} / 4 라운드
      </span>
      <span
        style={{
          fontSize: 12,
          color: isBreak ? '#A78BFA' : '#C9A84C',
          fontWeight: 600,
          marginLeft: 4,
        }}
      >
        {isBreak ? '휴식중' : '공부중'}
      </span>
    </div>
  );
};

export default PomodoroIndicator;
