import { useState, useEffect } from 'react';
import { type GachaCharacter, GRADE_COLORS } from '@/lib/gachaSystem';
import { useUserStore } from '@/store/useUserStore'; // 🎴 유저 스토어 임포트

interface CharacterDetailModalProps {
  character: GachaCharacter | null;
  isOpen: boolean;
  onClose: () => void;
}

const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({ character, isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // 🧬 Zustand 스토어에서 장착 상태 및 소유 데이터 가져오기
  const { ownedCharacterIds, equippedCharacterId, equipCharacter } = useUserStore();

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
  
  // 소유 여부 및 현재 장착 여부 판별
  const isOwned = ownedCharacterIds.includes(character.id);
  const isEquipped = equippedCharacterId === character.id;

  const handleEquip = () => {
    if (isOwned && !isEquipped) {
      equipCharacter(character.id);
    }
  };

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

        {/* Character Image */}
        <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', margin: '8px 0' }}>
          <img 
            src={character.imageUrl} 
            alt={character.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Name */}
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: 0, textAlign: 'center' }}>
          {character.name}
        </h2>

        {/* Subject pill */}
        <div style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 600 }}>
          {character.subject}
        </div>

        {/* Description */}
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '4px 0 8px', textAlign: 'center', lineHeight: 1.5 }}>
          {character.description}
        </p>

        {/* 🎴 대표 캐릭터 장착 버튼 영역 */}
        <div style={{ width: '100%', marginTop: 8 }}>
          {isOwned ? (
            <button
              onClick={handleEquip}
              disabled={isEquipped}
              style={{
                width: '100%',
                height: 48,
                backgroundColor: isEquipped ? 'rgba(201,168,76,0.15)' : '#C9A84C',
                border: isEquipped ? '1px solid #C9A84C' : 'none',
                borderRadius: 12,
                color: isEquipped ? '#C9A84C' : '#0F0F1A',
                fontSize: 15,
                fontWeight: 700,
                cursor: isEquipped ? 'default' : 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              {isEquipped ? '장착 중인 대표 캐릭터' : '대표 캐릭터로 장착하기'}
            </button>
          ) : (
            <div
              style={{
                width: '100%',
                height: 48,
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.15)',
                borderRadius: 12,
                color: 'rgba(255,255,255,0.3)',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              🔒 아직 획득하지 못한 캐릭터입니다
            </div>
          )}
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
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default CharacterDetailModal;