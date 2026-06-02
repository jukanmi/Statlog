import { useState, useEffect } from 'react';
import { GRADE_COLORS, SUBJECT_ICONS } from '@/constants/characters';
import { type Character } from '@/types';
import { cn } from '@/lib/utils';

interface GachaResultModalProps {
  isOpen: boolean;
  characters: Character[];
  newIds: Set<string>;
  onClose: () => void;
  onViewCollection: () => void;
}

interface ResultCardProps {
  character: Character;
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
    <div className="[perspective:600px] inline-block">
      <div
        className={cn(
          "rounded-2xl flex flex-col items-center justify-center relative transition-transform duration-500 ease-out border-2 shadow-xl",
          isLarge ? "w-[200px] h-[280px] gap-2.5 p-4" : "w-[110px] h-[150px] gap-1.5 p-2",
          revealed ? "rotate-y-0" : "[transform:rotateY(90deg)]"
        )}
        style={{ 
          backgroundColor: colors.bg, 
          borderColor: colors.border,
          boxShadow: colors.glow !== 'none' ? `0 0 ${isLarge ? 28 : 16}px ${colors.glow}` : 'none',
          transitionDelay: `${delay}ms`
        }}
      >
        {/* Grade badge */}
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 font-black",
            isLarge ? "top-3 text-lg" : "top-2 text-xs"
          )}
          style={{ color: colors.text }}
        >
          {character.grade}
        </div>

        {/* NEW badge */}
        {isNew && (
          <div className={cn(
            "absolute bg-[#C9A84C] text-[#0F0F1A] font-black rounded-full px-2 py-0.5 z-10",
            isLarge ? "top-2.5 right-2.5 text-[10px]" : "top-1.5 right-1.5 text-[8px]"
          )}>
            NEW!
          </div>
        )}

        {/* Subject icon avatar */}
        <div className={cn(
          "rounded-full bg-white/5 flex items-center justify-center",
          isLarge ? "w-20 h-20 text-4xl mt-6" : "w-12 h-12 text-2xl mt-4"
        )}>
          {icon}
        </div>

        {/* Name */}
        <div className={cn(
          "font-bold text-center leading-tight mt-1 text-white",
          isLarge ? "text-sm" : "text-[10px]"
        )}>
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
    <div className={cn(
      "fixed inset-0 z-[250] flex flex-col items-center justify-center transition-colors duration-300 px-5 pb-[calc(40px+env(safe-area-inset-bottom))] overflow-y-auto",
      backdropVisible ? "bg-black/85" : "bg-transparent"
    )}>
      {/* Flash overlay */}
      <div className={cn(
        "fixed inset-0 bg-white pointer-events-none z-[251] transition-opacity duration-350",
        flash ? "opacity-85" : "opacity-0"
      )} />

      {/* Content */}
      <div className="relative z-[252] flex flex-col items-center gap-6 w-full max-w-[390px]">
        {isSingle ? (
          <ResultCard
            character={characters[0]}
            isNew={newIds.has(characters[0].id)}
            revealed={revealed}
            delay={0}
            size="large"
          />
        ) : (
          <div className="grid grid-cols-4 gap-2 w-full">
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
        <div className={cn(
          "flex gap-3 transition-all duration-300",
          buttonsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        )}>
          <button
            onClick={onClose}
            className="w-[140px] h-[52px] bg-transparent border-2 border-[#C9A84C] rounded-full text-[#C9A84C] text-[15px] font-bold cursor-pointer active:scale-95 transition-transform"
          >
            다시 뽑기
          </button>
          <button
            onClick={onViewCollection}
            className="w-[140px] h-[52px] bg-[#C9A84C] border-none rounded-full text-[#0F0F1A] text-[15px] font-black cursor-pointer shadow-lg shadow-[#C9A84C]/40 active:scale-95 transition-transform"
          >
            도감 확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default GachaResultModal;
