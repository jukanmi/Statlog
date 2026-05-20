import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { ALL_CHARACTERS, GRADE_COLORS, SUBJECT_ICONS, type GachaCharacter } from '@/lib/gachaSystem';
import CharacterDetailModal from './CharacterDetailModal';

type GradeFilter = 'all' | 'S' | 'A' | 'B' | 'C';
const FILTERS: GradeFilter[] = ['all', 'S', 'A', 'B', 'C'];
const FILTER_LABELS: Record<GradeFilter, string> = { all: '전체', S: 'S', A: 'A', B: 'B', C: 'C' };

const CollectionScreen: React.FC = () => {
  const ownedIds = useUserStore((s) => s.ownedCharacterIds);
  const [filter, setFilter] = useState<GradeFilter>('all');
  const [selectedChar, setSelectedChar] = useState<GachaCharacter | null>(null);
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

  const handleCardClick = (char: GachaCharacter) => {
    if (!ownedSet.has(char.id)) return;
    setSelectedChar(char);
    setIsDetailOpen(true);
  };

  return (
    <div
      style={{
        backgroundColor: '#0F0F1A',
        minHeight: 'calc(100dvh - 100px)',
        paddingBottom: 'calc(90px + env(safe-area-inset-bottom))',
      }}
    >
      {/* Header */}
      <div style={{ padding: '24px 16px 16px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: 0, marginBottom: 4 }}>
          나의 도감
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>
          {ownedCount} / {total} 수집완료
        </p>

        {/* Progress bar */}
        <div
          style={{
            height: 6,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: barAnimated ? `${(ownedCount / total) * 100}%` : '0%',
              background: 'linear-gradient(90deg, #C9A84C 0%, #E8CC7A 100%)',
              borderRadius: 3,
              transition: 'width 700ms ease-out',
            }}
          />
        </div>
      </div>

      {/* Filter row */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 16px 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flexShrink: 0,
              backgroundColor: filter === f ? '#C9A84C' : '#1A1A2E',
              color: filter === f ? '#0F0F1A' : 'rgba(255,255,255,0.45)',
              border: 'none',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: filter === f ? 700 : 500,
              cursor: 'pointer',
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          padding: '0 16px',
        }}
      >
        {filtered.map((char) => {
          const isOwned = ownedSet.has(char.id);
          const colors = GRADE_COLORS[char.grade];
          const icon = SUBJECT_ICONS[char.subject] ?? '⭐';

          return (
            <button
              key={char.id}
              onClick={() => handleCardClick(char)}
              disabled={!isOwned}
              style={{
                backgroundColor: isOwned ? '#1A1A2E' : '#0E0E1A',
                border: `1px solid ${isOwned ? colors.border : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 14,
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                cursor: isOwned ? 'pointer' : 'default',
                position: 'relative',
                transition: 'transform 150ms ease',
              }}
              onMouseDown={(e) => {
                if (isOwned) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            >
              {/* Grade badge */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: isOwned ? colors.bg : 'rgba(255,255,255,0.04)',
                  color: isOwned ? colors.text : 'rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  padding: '2px 7px',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {isOwned ? char.grade : '?'}
              </div>

              {/* Avatar circle */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: isOwned
                    ? `color-mix(in srgb, ${colors.bg} 60%, transparent)`
                    : 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  marginTop: 4,
                  border: isOwned ? `1px solid ${colors.border}30` : '1px solid rgba(255,255,255,0.06)',
                  position: 'relative',
                }}
              >
                <span style={isOwned ? undefined : { filter: 'saturate(0) brightness(0.4) opacity(0.5)', userSelect: 'none' }}>
                  {icon}
                </span>
                {!isOwned && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(15,15,26,0.9)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      color: 'rgba(255,255,255,0.35)',
                      fontWeight: 700,
                    }}
                  >
                    ?
                  </div>
                )}
              </div>

              {/* Name */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: isOwned ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  letterSpacing: isOwned ? undefined : '0.05em',
                }}
              >
                {isOwned ? char.name : '? ? ?'}
              </div>

              {/* Subject */}
              {isOwned && (
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.35)',
                    textAlign: 'center',
                  }}
                >
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
