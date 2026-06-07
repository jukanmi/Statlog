import { useState, useEffect } from 'react';
import { GRADE_COLORS, ALL_CHARACTERS } from '@/constants/characters';
import { type Character } from '@/types';
import { useUserStore } from '@/store/useUserStore';
import { syncUserToServer, encodeBitmask } from '@/lib/api';
import { calcLevel, calcLevelProgress, calcEvolutionStage, getDisplayCharacterId } from '@/lib/characterLevel';
import { cn } from '@/lib/utils';

interface CharacterDetailModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
}

const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({ character, isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const { ownedCharacterIds, equippedCharacterId, equipCharacter, characterExpMap, potionQueue, buyPotion, user } = useUserStore();

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted || !character) return null;

  const colors = GRADE_COLORS[character.grade];
  const isOwned = ownedCharacterIds.includes(character.id);
  const isEquipped = equippedCharacterId === character.id;

  const totalExp = characterExpMap[character.id] ?? 0;
  const progress = calcLevelProgress(totalExp);
  const stage = calcEvolutionStage(progress.level);
  const displayId = getDisplayCharacterId(character.id, progress.level);
  const displayChar = ALL_CHARACTERS.find((c) => c.id === displayId) ?? character;
  const nextEvolutionLevel = stage === 0 ? 21 : stage === 1 ? 41 : null;
  const activePotionMultiplier = potionQueue[0]?.multiplier ?? null;

  const handleEquip = () => {
    if (character && isOwned && !isEquipped) {
      equipCharacter(character.id);
    }
  };

  return (
    <div
      onClick={onClose}
      className={cn(
        "fixed inset-0 z-[200] flex items-end justify-center transition-colors duration-300",
        visible ? "bg-black/60" : "bg-transparent"
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-[430px] bg-card rounded-t-[32px] p-8 px-6 pb-[calc(32px+env(safe-area-inset-bottom))] transition-transform duration-300 flex flex-col items-center gap-4 shadow-2xl",
          visible ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Grade badge */}
        <div
          className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl font-black shadow-lg"
          style={{ 
            backgroundColor: colors.bg, 
            borderColor: colors.border, 
            color: colors.text,
            boxShadow: colors.glow !== 'none' ? `0 0 24px ${colors.glow}` : 'none'
          }}
        >
          {character.grade}
        </div>

        {/* Character Image */}
        <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', margin: '8px 0' }}>
          <img
            src={displayChar.imageUrl}
            alt={displayChar.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Name */}
        <h2 className="text-2xl font-black text-foreground m-0 text-center tracking-tight">
          {character.name}
        </h2>

        {/* Subject pill */}
        <div className="bg-[#C9A84C]/15 text-[#C9A84C] rounded-full px-5 py-1 text-sm font-bold border border-[#C9A84C]/20">
          {character.subject}
        </div>

        {/* Exp bar */}
        {isOwned && (
          <div style={{ width: '100%', marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#C9A84C' }}>
                Lv.{progress.level}
                {progress.level < 60 && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginLeft: 6 }}>
                    → Lv.{progress.level + 1}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                {progress.level < 60
                  ? `${progress.currentLevelExp} / ${progress.nextLevelExp} exp`
                  : 'MAX'}
              </span>
            </div>
            <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(progress.progressRatio * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #C9A84C 0%, #E8CC7A 100%)',
                  borderRadius: 3,
                  transition: 'width 600ms ease-out',
                }}
              />
            </div>
            {nextEvolutionLevel && (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'right' }}>
                {nextEvolutionLevel - progress.level}레벨 후 진화
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-foreground/60 m-0 text-center leading-relaxed max-w-[280px]">
          {character.description}
        </p>

        {/* Action Button */}
        <div className="w-full mt-4">
          {isOwned ? (
            <button
              onClick={handleEquip}
              disabled={isEquipped}
              className={cn(
                "w-full h-[52px] rounded-2xl text-[15px] font-black transition-all duration-200 active:scale-95 border",
                isEquipped 
                  ? "bg-[#C9A84C]/10 border-[#C9A84C]/30 text-[#C9A84C] cursor-default" 
                  : "bg-[#C9A84C] border-none text-[#0F0F1A] cursor-pointer hover:brightness-110 shadow-lg shadow-[#C9A84C]/20"
              )}
            >
              {isEquipped ? '장착 중인 대표 캐릭터' : '대표 캐릭터로 장착하기'}
            </button>
          ) : (
            <div className="w-full h-[52px] bg-foreground/5 border border-dashed border-foreground/15 rounded-2xl text-foreground/30 text-sm font-bold flex items-center justify-center gap-2">
              <span>🔒</span> 아직 획득하지 못한 캐릭터입니다
            </div>
          )}
        </div>

        {/* Potion shop */}
        {isEquipped && (
          <div
            style={{
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '12px 14px',
              marginTop: 4,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              경험치 물약
              {potionQueue.length > 0 && (
                <span style={{ color: '#C9A84C', marginLeft: 6 }}>
                  대기 {potionQueue.length}개 (다음 세션 ×{activePotionMultiplier})
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => buyPotion('small')}
                disabled={user.gold < 200}
                style={{
                  flex: 1,
                  backgroundColor: user.gold >= 200 ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${user.gold >= 200 ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10,
                  padding: '8px 4px',
                  color: user.gold >= 200 ? '#C9A84C' : 'rgba(255,255,255,0.2)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: user.gold >= 200 ? 'pointer' : 'default',
                  textAlign: 'center' as const,
                  lineHeight: 1.5,
                }}
              >
                소 ×1.5<br />
                <span style={{ fontSize: 10, fontWeight: 500 }}>200골드</span>
              </button>
              <button
                onClick={() => buyPotion('large')}
                disabled={user.gems < 1}
                style={{
                  flex: 1,
                  backgroundColor: user.gems >= 1 ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${user.gems >= 1 ? '#A78BFA' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10,
                  padding: '8px 4px',
                  color: user.gems >= 1 ? '#A78BFA' : 'rgba(255,255,255,0.2)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: user.gems >= 1 ? 'pointer' : 'default',
                  textAlign: 'center' as const,
                  lineHeight: 1.5,
                }}
              >
                대 ×2.0<br />
                <span style={{ fontSize: 10, fontWeight: 500 }}>1젬</span>
              </button>
            </div>
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full h-12 bg-foreground/5 border-none rounded-2xl text-foreground/60 text-[15px] font-bold cursor-pointer hover:bg-foreground/10 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default CharacterDetailModal;