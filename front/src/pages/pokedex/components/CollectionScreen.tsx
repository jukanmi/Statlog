import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { ALL_CHARACTERS, GRADE_COLORS, type GachaCharacter } from '@/lib/gachaSystem';
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
        <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
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
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '0 16px' }}>
        {filtered.map((char) => {
          const isOwned = ownedSet.has(char.id);
          const colors = GRADE_COLORS[char.grade];

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
              onMouseDown={(e) => { if (isOwned) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)'; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
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

              {/* Avatar circle (이미지 전용 태그 전환 완료 🖼️) */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: isOwned ? `color-mix(in srgb, ${colors.bg} 60%, transparent)` : 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 4,
                  border: isOwned ? `1px solid ${colors.border}30` : '1px solid rgba(255,255,255,0.06)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* 🖼️ 이미지가 연동된 메인 태그 구역 */}
                <img 
                  src={char.imageUrl} 
                  alt={char.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    // 미획득 상태일 때 기획서 규격대로 완전 실루엣(검게 처리) 및 흑백 처리 
                    ...(isOwned ? {} : { filter: 'saturate(0) brightness(0.2) opacity(0.4)', userSelect: 'none' })
                  }}
                  onError={(e) => {
                    // 💡 혹시나 아직 public에 이미지를 안 넣었을 때 에러 아이콘 방지용 자동 깨짐 대처
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />

                {!isOwned && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      color: 'rgba(255,255,255,0.4)',
                      fontWeight: 700,
                    }}
                  >
                    ?
                  </div>
                )}
              </div>

              {/* Name */}
              <div style={{ fontSize: 11, fontWeight: 700, color: isOwned ? '#FFFFFF' : 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 1.3 }}>
                {isOwned ? char.name : '? ? ?'}
              </div>

              {/* Subject */}
              {isOwned && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
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