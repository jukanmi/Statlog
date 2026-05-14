import React from 'react';

interface TodayStudyProgressProps {
  formattedTime: string;
}

const TodayStudyProgress: React.FC<TodayStudyProgressProps> = ({ formattedTime }) => {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 4, letterSpacing: '0.5px' }}>
        오늘의 학습
      </div>
      <div style={{ fontSize: 14, color: '#C9A84C', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {formattedTime}
      </div>
    </div>
  );
};

export default TodayStudyProgress;
