import { useUserStore } from '@/store/useUserStore';
import { cn } from '@/lib/utils';

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
      valueColor: 'text-[#C9A84C]',
      bg: 'bg-[#C9A84C]/10',
      border: 'border-[#C9A84C]/20',
    },
    {
      icon: '💎',
      value: String(user.gems),
      label: '소환석',
      valueColor: 'text-[#60A5FA]',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      icon: '⚔️',
      value: String(ownedCharacterIds.length),
      label: '캐릭터',
      valueColor: 'text-[#4ADE80]',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    {
      icon: '⏱️',
      value: `${Math.floor(TOTAL_MINUTES / 60)}h ${TOTAL_MINUTES % 60}m`,
      label: '총 학습',
      valueColor: 'text-[#A78BFA]',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
  ];

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-lg">
      <div className="text-foreground text-base font-bold mb-4">
        보유 재화
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {cells.map((cell) => (
          <div 
            key={cell.label} 
            className={cn(
              "rounded-xl p-4 border transition-all duration-200 hover:brightness-110 shadow-sm",
              cell.bg,
              cell.border
            )}
          >
            <div className="text-2xl mb-2">{cell.icon}</div>
            <div className={cn(
              "text-[20px] font-black tracking-tight tabular-nums",
              cell.valueColor
            )}>
              {cell.value}
            </div>
            <div className="text-foreground/40 text-[11px] font-bold mt-0.5 tracking-wide uppercase">
              {cell.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrencyCard;
