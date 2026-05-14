import { useUserStore } from '@/store/useUserStore';

const TOTAL_MINUTES = 2220; // sum of MOCK_30 data

interface CellDef {
  icon: string;
  value: string;
  label: string;
  valueColor: string;
  bg: string;
  border: string;
}

const CurrencyCard: React.FC = () => {
  const { user, ownedCharacterIds } = useUserStore();

  const cells: CellDef[] = [
    {
      icon: '🪙',
      value: user.gold.toLocaleString(),
      label: '골드',
      valueColor: '#C9A84C',
      bg: 'rgba(201,168,76,0.08)',
      border: 'rgba(201,168,76,0.2)',
    },
    {
      icon: '💎',
      value: String(user.gems),
      label: '소환석',
      valueColor: '#60A5FA',
      bg: 'rgba(59,130,246,0.08)',
      border: 'rgba(59,130,246,0.2)',
    },
    {
      icon: '⚔️',
      value: String(ownedCharacterIds.length),
      label: '캐릭터',
      valueColor: '#4ADE80',
      bg: 'rgba(74,222,128,0.08)',
      border: 'rgba(74,222,128,0.2)',
    },
    {
      icon: '⏱️',
      value: `${Math.floor(TOTAL_MINUTES / 60)}h ${TOTAL_MINUTES % 60}m`,
      label: '총 학습',
      valueColor: '#A78BFA',
      bg: 'rgba(124,58,237,0.08)',
      border: 'rgba(124,58,237,0.2)',
    },
  ];

  return (
    <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
      <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        보유 재화
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
      }}>
        {cells.map((cell) => (
          <div key={cell.label} style={{
            background: cell.bg,
            border: `1px solid ${cell.border}`,
            borderRadius: 12,
            padding: 14,
          }}>
            <div style={{ fontSize: 24 }}>{cell.icon}</div>
            <div style={{
              color: cell.valueColor,
              fontSize: 20,
              fontWeight: 700,
              marginTop: 6,
            }}>
              {cell.value}
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 12,
              marginTop: 2,
            }}>
              {cell.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrencyCard;
