import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { ALL_CHARACTERS, GRADE_COLORS } from '@/constants/characters';
import { type Character } from '@/types';
import { calcLevel, getDisplayCharacterId } from '@/lib/characterLevel';
import CharacterDetailModal from './CharacterDetailModal';
import { cn } from '@/lib/utils';

type GradeFilter = 'all' | 'S' | 'A' | 'B' | 'C';
const FILTERS: GradeFilter[] = ['all', 'S', 'A', 'B', 'C'];
const FILTER_LABELS: Record<GradeFilter, string> = { all: '전체', S: 'S', A: 'A', B: 'B', C: 'C' };

const CollectionScreen: React.FC = () => {
  const ownedIds = useUserStore((s) => s.ownedCharacterIds);
  const characterExpMap = useUserStore((s) => s.characterExpMap);
  const [filter, setFilter] = useState<GradeFilter>('all');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [barAnimated, setBarAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBarAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  const ownedSet = new Set(ownedIds);
  const ownedCount = ownedIds.length;
  const total = ALL_CHARACTERS.length;

  const filtered = filter === 'all'
    ? ALL_CHARACTERS
    : ALL_CHARACTERS.filter((c) => c.grade === filter);

  const handleCardClick = (char: Character) => {
    if (!ownedSet.has(char.id)) return;
    setSelectedChar(char);
    setIsDetailOpen(true);
  };

  return (
    <div className="bg-background min-h-[calc(100dvh-100px)] pb-[calc(90px+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-end mb-1.5">
          <h2 className="text-xl font-bold text-foreground m-0">나의 도감</h2>
          <p className="text-[13px] text-foreground/40 m-0">
            {ownedCount} / {total} 수집완료
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C9A84C] to-[#E8CC7A] rounded-full transition-all duration-700 ease-out"
            style={{ width: barAnimated ? `${(ownedCount / total) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Filter row */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex-shrink-0 border-none rounded-full px-4 py-1.5 text-[13px] font-bold cursor-pointer transition-all duration-200",
              filter === f ? "bg-[#C9A84C] text-background" : "bg-card text-foreground/45 hover:text-foreground/70"
            )}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2.5 px-4">
        {filtered.map((char) => {
          const isOwned = ownedSet.has(char.id);
          const colors = GRADE_COLORS[char.grade];

          return (
            <button
              key={char.id}
              onClick={() => handleCardClick(char)}
              disabled={!isOwned}
              className={cn(
                "rounded-2xl p-3 px-2 flex flex-col items-center gap-1.5 relative transition-all duration-200 active:scale-95 border",
                isOwned 
                  ? "bg-card cursor-pointer" 
                  : "bg-background cursor-default border-border opacity-80"
              )}
              style={isOwned ? { borderColor: colors.border } : {}}
            >
              {/* Grade badge */}
              <div
                className={cn(
                  "absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[9px] font-black",
                  isOwned ? "bg-opacity-100" : "bg-foreground/5 text-foreground/20"
                )}
                style={isOwned ? { backgroundColor: colors.bg, color: colors.text } : {}}
              >
                {isOwned ? char.grade : '?'}
              </div>

              {/* Avatar circle */}
              <div
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center mt-1 border relative overflow-hidden",
                  isOwned ? "bg-opacity-20" : "bg-foreground/5 border-border"
                )}
                style={isOwned ? { backgroundColor: colors.bg, borderColor: `${colors.border}40` } : {}}
              >
                {(() => {
                  const totalExp = characterExpMap[char.id] ?? 0;
                  const level = calcLevel(totalExp);
                  const displayId = getDisplayCharacterId(char.id, level);
                  const displayChar = ALL_CHARACTERS.find((c) => c.id === displayId) ?? char;
                  return (
                    <img
                      src={isOwned ? displayChar.imageUrl : char.imageUrl}
                      alt={char.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        ...(isOwned ? {} : { filter: 'saturate(0) brightness(0.2) opacity(0.4)', userSelect: 'none' }),
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  );
                })()}

                {!isOwned && (
                  <div className="absolute inset-0 flex items-center justify-center text-lg text-foreground/20 font-black">
                    ?
                  </div>
                )}
              </div>

              {/* Level badge */}
              {isOwned && (() => {
                const totalExp = characterExpMap[char.id] ?? 0;
                const level = calcLevel(totalExp);
                return (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      backgroundColor: 'rgba(0,0,0,0.55)',
                      color: '#C9A84C',
                      borderRadius: 8,
                      padding: '2px 6px',
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    Lv.{level}
                  </div>
                );
              })()}

              {/* Name */}
              <div className={cn(
                "text-[11px] font-bold text-center leading-tight",
                isOwned ? "text-foreground" : "text-foreground/20"
              )}>
                {isOwned ? char.name : '???'}
              </div>

              {/* Subject */}
              {isOwned && (
                <div className="text-[9px] text-foreground/35 text-center font-medium">
                  {char.subject}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Detail modal */}
      <CharacterDetailModal
        character={selectedChar}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
};

export default CollectionScreen;