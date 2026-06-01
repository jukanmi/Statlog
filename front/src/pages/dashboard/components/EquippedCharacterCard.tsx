import { useUserStore } from '@/store/useUserStore';
import { ALL_CHARACTERS, GRADE_COLORS } from '@/constants/characters';
import { calcLevelProgress, getDisplayCharacterId, calcEvolutionStage } from '@/lib/characterLevel';

const EquippedCharacterCard: React.FC = () => {
  const equippedCharacterId = useUserStore((s) => s.equippedCharacterId);
  const characterExpMap = useUserStore((s) => s.characterExpMap);

  if (!equippedCharacterId) {
    return (
      <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 13, margin: 0 }}>
          도감에서 캐릭터를 장착해 보세요
        </p>
      </div>
    );
  }

  const totalExp = characterExpMap[equippedCharacterId] ?? 0;
  const progress = calcLevelProgress(totalExp);
  const displayId = getDisplayCharacterId(equippedCharacterId, progress.level);
  const char = ALL_CHARACTERS.find((c) => c.id === displayId)
    ?? ALL_CHARACTERS.find((c) => c.id === equippedCharacterId);

  if (!char) return null;

  const colors = GRADE_COLORS[char.grade];
  const stage = calcEvolutionStage(progress.level);
  const nextEvolutionLevel = stage === 0 ? 21 : stage === 1 ? 41 : null;

  return (
    <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
        장착 캐릭터
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          border: `2px solid ${colors.border}`,
          boxShadow: colors.glow !== 'none' ? `0 0 12px ${colors.glow}` : undefined,
        }}>
          <img src={char.imageUrl} alt={char.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{char.name}</span>
            <span style={{
              backgroundColor: colors.bg, color: colors.text,
              borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700,
            }}>{char.grade}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: '#C9A84C', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              Lv.{progress.level}
            </span>
            <div style={{
              flex: 1, height: 4,
              backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(progress.progressRatio * 100, 100)}%`,
                background: 'linear-gradient(90deg, #C9A84C, #E8CC7A)',
                borderRadius: 2,
                transition: 'width 600ms ease-out',
              }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, flexShrink: 0 }}>
              {progress.level < 60
                ? `${progress.currentLevelExp}/${progress.nextLevelExp}`
                : 'MAX'}
            </span>
          </div>

          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
            {nextEvolutionLevel
              ? `진화까지 ${nextEvolutionLevel - progress.level}레벨`
              : '최종 진화 완료'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquippedCharacterCard;
