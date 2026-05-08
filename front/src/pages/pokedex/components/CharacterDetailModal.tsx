import { useState, useEffect } from 'react';
import { type GachaCharacter, GRADE_COLORS, SUBJECT_ICONS } from '@/lib/gachaSystem';

interface CharacterDetailModalProps {
  character: GachaCharacter | null;
  isOpen: boolean;
  onClose: () => void;
}

const SUBJECT_STAT_BOOST: Record<string, string[]> = {
  수학: ['INT +2', 'END +1'],
  과학: ['INT +2', 'END +1'],
  프로그래밍: ['INT +2', 'END +1'],
  영어: ['CHA +2', 'INT +1', 'END +1'],
  국어: ['CHA +2', 'INT +1', 'END +1'],
  사회: ['CHA +1', 'INT +1', 'END +1'],
  기타: ['INT +1', 'END +1'],
};

const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  isOpen,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 16);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted || !character) return null;

  const colors = GRADE_COLORS[character.grade];
  const icon = SUBJECT_ICONS[character.subject] ?? '⭐';
  const statBoosts = SUBJECT_STAT_BOOST[character.subject] ?? SUBJECT_STAT_BOOST['기타'];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backgroundColor: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        transition: 'background-color 300ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 430,
          backgroundColor: '#1A1A2E',
          borderRadius: '24px 24px 0 0',
          padding: '28px 24px calc(28px + env(safe-area-inset-bottom))',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 300ms ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Grade badge */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: colors.bg,
            border: `2px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 700,
            color: colors.text,
            boxShadow: colors.glow !== 'none' ? `0 0 20px ${colors.glow}` : undefined,
          }}
        >
          {character.grade}
        </div>

        {/* Character icon */}
        <div style={{ fontSize: 40 }}>{icon}</div>

        {/* Name */}
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: 0, textAlign: 'center' }}>
          {character.name}
        </h2>

        {/* Subject pill */}
        <div
          style={{
            backgroundColor: 'rgba(201,168,76,0.15)',
            color: '#C9A84C',
            borderRadius: 20,
            padding: '4px 14px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {character.subject}
        </div>

        {/* Description */}
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '4px 0 8px', textAlign: 'center' }}>
          {character.description}
        </p>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

        {/* Stat boosts */}
        <div style={{ width: '100%' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 10px', textAlign: 'center', letterSpacing: '0.5px' }}>
            이 캐릭터가 강화하는 능력
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {statBoosts.map((stat) => (
              <div
                key={stat}
                style={{
                  backgroundColor: 'rgba(201,168,76,0.1)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  borderRadius: 10,
                  padding: '6px 14px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#C9A84C',
                }}
              >
                {stat}
              </div>
            ))}
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            height: 48,
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: 12,
            color: 'rgba(255,255,255,0.6)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default CharacterDetailModal;
