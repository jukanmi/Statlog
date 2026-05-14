interface ResultScreenProps {
  correctCount: number;
  totalCount: number;
  onContinue: () => void;
}

interface ResultConfig {
  emoji: string;
  title: string;
}

function getResultConfig(correct: number, total: number): ResultConfig {
  if (correct === total) return { emoji: '🏆', title: '완벽해요!' };
  if (correct >= total * (2 / 3)) return { emoji: '👍', title: '잘 했어요!' };
  return { emoji: '💪', title: '다음엔 더 잘할 수 있어요' };
}

const ResultScreen: React.FC<ResultScreenProps> = ({ correctCount, totalCount, onContinue }) => {
  const { emoji, title } = getResultConfig(correctCount, totalCount);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: '#0F0F1A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 32px',
        maxWidth: 430,
        margin: '0 auto',
        gap: 0,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Trophy/emoji */}
      <div
        style={{
          fontSize: 80,
          lineHeight: 1,
          marginBottom: 28,
          animation: 'resultPop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        {emoji}
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: '#FFFFFF',
          margin: 0,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        {title}
      </h1>

      {/* Score */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: '#C9A84C',
          marginBottom: 10,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-1px',
        }}
      >
        {correctCount} / {totalCount} 정답
      </div>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.4)',
          margin: 0,
          marginBottom: 52,
          textAlign: 'center',
        }}
      >
        오늘도 한 걸음 성장했어요
      </p>

      {/* CTA */}
      <button
        onClick={onContinue}
        style={{
          width: 200,
          height: 52,
          backgroundColor: '#C9A84C',
          border: 'none',
          borderRadius: 26,
          color: '#0F0F1A',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 0 28px rgba(201,168,76,0.4)',
          transition: 'transform 150ms ease, box-shadow 150ms ease',
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px rgba(201,168,76,0.3)';
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(201,168,76,0.4)';
        }}
      >
        스탯 확인하기
      </button>

      <style>{`
        @keyframes resultPop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ResultScreen;
