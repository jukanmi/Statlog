import { useState, useEffect } from 'react';
import { type GachaCharacter, GRADE_COLORS, SUBJECT_ICONS } from '@/lib/gachaSystem';

interface GachaResultModalProps {
  isOpen: boolean;
  characters: GachaCharacter[];
  newIds: Set<string>;
  onClose: () => void;
  onViewCollection: () => void;
}

interface ResultCardProps {
  character: GachaCharacter;
  isNew: boolean;
  revealed: boolean;
  delay: number;
  size: 'large' | 'small';
}

const ResultCard: React.FC<ResultCardProps> = ({ character, isNew, revealed, delay, size }) => {
  const colors = GRADE_COLORS[character.grade];
  const icon = SUBJECT_ICONS[character.subject] ?? '⭐';
  const isLarge = size === 'large';

  return (
    <div style={{ perspective: '600px', display: 'inline-block' }}>
      <div
        style={{
          width: isLarge ? 200 : 110,
          height: isLarge ? 280 : 150,
          borderRadius: isLarge ? 16 : 12,
          backgroundColor: colors.bg,
          border: `2px solid ${colors.border}`,
          boxShadow: colors.glow !== 'none' ? `0 0 ${isLarge ? 28 : 16}px ${colors.glow}` : undefined,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isLarge ? 10 : 6,
          padding: isLarge ? '16px 12px' : '10px 8px',
          position: 'relative',
          transform: revealed ? 'rotateY(0deg)' : 'rotateY(90deg)',
          transition: `transform 500ms ease-out ${delay}ms`,
        }}
      >
        {/* Grade badge */}
        <div
          style={{
            position: 'absolute',
            top: isLarge ? 12 : 8,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: isLarge ? 18 : 13,
            fontWeight: 700,
            color: colors.text,
          }}
        >
          {character.grade}
        </div>

        {/* NEW badge */}
        {isNew && (
          <div
            style={{
              position: 'absolute',
              top: isLarge ? 10 : 6,
              right: isLarge ? 10 : 6,
              backgroundColor: '#C9A84C',
              color: '#0F0F1A',
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 10,
              padding: '2px 7px',
            }}
          >
            NEW!
          </div>
        )}

        {/* Subject icon avatar */}
        <div
          style={{
            width: isLarge ? 80 : 48,
            height: isLarge ? 80 : 48,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isLarge ? 36 : 22,
            marginTop: isLarge ? 24 : 16,
          }}
        >
          {icon}
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: isLarge ? 14 : 10,
            fontWeight: 700,
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: 1.3,
            marginTop: 4,
          }}
        >
          {character.name}
        </div>
      </div>
    </div>
  );
};

const GachaResultModal: React.FC<GachaResultModalProps> = ({
  isOpen,
  characters,
  newIds,
  onClose,
  onViewCollection,
}) => {
  const [mounted, setMounted] = useState(false);
  const [backdropVisible, setBackdropVisible] = useState(false);
  const [flash, setFlash] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setRevealed(false);
      setButtonsVisible(false);
      requestAnimationFrame(() => {
        setBackdropVisible(true);
        setFlash(true);
        setTimeout(() => setFlash(false), 350);
        setTimeout(() => setRevealed(true), 420);
        setTimeout(() => setButtonsVisible(true), 1100);
      });
    } else {
      setBackdropVisible(false);
      setRevealed(false);
      setButtonsVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const isSingle = characters.length === 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: backdropVisible ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)',
        transition: 'background-color 300ms ease',
        padding: '20px 20px calc(40px + env(safe-area-inset-bottom))',
        overflowY: 'auto',
      }}
    >
      {/* Flash overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'white',
          opacity: flash ? 0.85 : 0,
          transition: 'opacity 350ms ease',
          pointerEvents: 'none',
          zIndex: 251,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 252,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          width: '100%',
          maxWidth: 390,
        }}
      >
        {isSingle ? (
          /* Single pull */
          <ResultCard
            character={characters[0]}
            isNew={newIds.has(characters[0].id)}
            revealed={revealed}
            delay={0}
            size="large"
          />
        ) : (
          /* 10-pull grid — 2 columns */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              width: '100%',
            }}
          >
            {characters.map((char, i) => (
              <ResultCard
                key={`${char.id}-${i}`}
                character={char}
                isNew={newIds.has(char.id)}
                revealed={revealed}
                delay={i * 60}
                size="small"
              />
            ))}
          </div>
        )}

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            opacity: buttonsVisible ? 1 : 0,
            transform: buttonsVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 300ms ease, transform 300ms ease',
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: 140,
              height: 48,
              backgroundColor: 'transparent',
              border: '1.5px solid #C9A84C',
              borderRadius: 24,
              color: '#C9A84C',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            다시 뽑기
          </button>
          <button
            onClick={onViewCollection}
            style={{
              width: 140,
              height: 48,
              backgroundColor: '#C9A84C',
              border: 'none',
              borderRadius: 24,
              color: '#0F0F1A',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(201,168,76,0.4)',
            }}
          >
            도감 확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default GachaResultModal;
