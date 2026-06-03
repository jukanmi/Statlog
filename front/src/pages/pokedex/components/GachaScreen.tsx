import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { pullOne, pullTen } from '@/lib/gachaService';
import { type Character } from '@/types';
import { syncUserToServer, encodeBitmask } from '@/lib/api';
import GachaResultModal from './GachaResultModal';
import { cn } from '@/lib/utils';

interface GachaScreenProps {
  onViewCollection: () => void;
}

const MysteryFigure: React.FC = () => (
  <svg width="100" height="130" viewBox="0 0 100 130" className="block">
    {/* Sparkles */}
    <circle cx="10" cy="14" r="4" fill="#C9A84C" className="opacity-40 animate-pulse" />
    <circle cx="88" cy="8"  r="3" fill="#C9A84C" className="opacity-30 animate-pulse [animation-delay:1s]" />
    <circle cx="96" cy="65" r="4" fill="#C9A84C" className="opacity-35 animate-pulse [animation-delay:0.5s]" />
    <circle cx="84" cy="120" r="3" fill="#C9A84C" className="opacity-25 animate-pulse [animation-delay:1.5s]" />
    <circle cx="16" cy="118" r="4" fill="#C9A84C" className="opacity-35 animate-pulse [animation-delay:0.8s]" />
    <circle cx="4"  cy="55"  r="3" fill="#C9A84C" className="opacity-30 animate-pulse [animation-delay:1.2s]" />
    {/* Silhouette - Optimized with Tailwind colors */}
    <g className="fill-white/10 blur-[1px]">
      <circle cx="50" cy="22" r="18" />
      <rect x="44" y="38" width="12" height="8" rx="4" />
      <rect x="27" y="44" width="46" height="42" rx="9" />
      <rect x="7"  y="48" width="18" height="12" rx="6" />
      <rect x="75" y="48" width="18" height="12" rx="6" />
      <rect x="29" y="84" width="16" height="38" rx="7" />
      <rect x="55" y="84" width="16" height="38" rx="7" />
    </g>
  </svg>
);

interface GachaResult {
  characters: Character[];
  newIds: Set<string>;
}

const GachaScreen: React.FC<GachaScreenProps> = ({ onViewCollection }) => {
  const gems = useUserStore((s) => s.user.gems);
  const gold = useUserStore((s) => s.user.gold);
  const ownedCharacterIds = useUserStore((s) => s.ownedCharacterIds);
  const updateCurrency = useUserStore((s) => s.updateCurrency);
  const addCharacter = useUserStore((s) => s.addCharacter);

  const [result, setResult] = useState<GachaResult | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'gems' | 'gold'>('gems');

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const GEM_COSTS = { single: 10, ten: 90 };
  const GOLD_COSTS = { single: 500, ten: 4500 };

  const handlePull = (count: 1 | 10) => {
    const prevOwned = new Set(ownedCharacterIds);

    if (currency === 'gems') {
      const cost = count === 1 ? GEM_COSTS.single : GEM_COSTS.ten;
      if (gems < cost) {
        setToast('소환석이 부족해요 💎');
        return;
      }
      updateCurrency(undefined, gems - cost);
    } else {
      const cost = count === 1 ? GOLD_COSTS.single : GOLD_COSTS.ten;
      if (gold < cost) {
        setToast('골드가 부족해요 🪙');
        return;
      }
      updateCurrency(gold - cost, undefined);
    }

    const characters = count === 1 ? [pullOne()] : pullTen();
    characters.forEach((c) => addCharacter(c.id));

    const newIds = new Set(
      characters.map((c) => c.id).filter((id) => !prevOwned.has(id))
    );

    setResult({ characters, newIds });
    setIsResultOpen(true);

    const latestState = useUserStore.getState();
    syncUserToServer({
      gold: latestState.user.gold,
      gems: latestState.user.gems,
      owned_characters_bits: encodeBitmask(latestState.ownedCharacterIds),
      equipped_character_id: latestState.equippedCharacterId,
    });
  };

  const handleClose = () => setIsResultOpen(false);

  const handleViewCollection = () => {
    setIsResultOpen(false);
    onViewCollection();
  };

  return (
    <div className="min-h-[calc(100dvh-100px)] bg-background flex flex-col items-center p-8 px-5 pb-[calc(90px+env(safe-area-inset-bottom))] relative gap-7">
      {/* Ambient glow */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Title */}
      <div className="text-center">
        <h2 className="text-[22px] font-bold text-foreground mb-1.5">캐릭터 소환</h2>
        <p className="text-[13px] text-foreground/40">공부하면 소환석이 쌓여요</p>
      </div>

      {/* Currency type toggle */}
      <div className="flex gap-1.5 bg-foreground/5 rounded-[20px] p-1">
        {(['gems', 'gold'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            className={cn(
              "rounded-2xl px-4 py-1.5 text-[13px] font-semibold border-none cursor-pointer transition-all duration-200",
              currency === c 
                ? (c === 'gems' ? "bg-[#A78BFA] text-background" : "bg-[#C9A84C] text-background") 
                : "bg-transparent text-foreground/40 hover:text-foreground/60"
            )}
          >
            {c === 'gems' ? '💎 소환석' : '🪙 골드'}
          </button>
        ))}
      </div>

      {/* Currency row */}
      <div className="flex gap-3 items-center">
        <div className="bg-card rounded-[20px] px-4 py-2 flex items-center gap-1.5 text-sm text-foreground font-semibold shadow-inner border border-border">
          <span>💎</span>
          <span className="tabular-nums">{gems}</span>
          <span className="text-foreground/40 text-xs">소환석</span>
        </div>
        <div className="bg-card rounded-[20px] px-4 py-2 flex items-center gap-1.5 text-sm text-foreground font-semibold shadow-inner border border-border">
          <span>🪙</span>
          <span className="tabular-nums">{gold.toLocaleString()}</span>
          <span className="text-foreground/40 text-xs">골드</span>
        </div>
      </div>

      {/* Gacha banner card */}
      <div className="w-[300px] h-[360px] bg-gradient-to-br from-card to-[#2D1B69] border border-[#7C3AED]/40 rounded-[20px] shadow-[0_0_40px_rgba(124,58,237,0.2)] flex flex-col items-center justify-between p-5 pb-6 relative shrink-0">
        <div className="text-[12px] text-white/35 text-center">★★★ S등급 확률 3%</div>
        <MysteryFigure />
        <div className="text-[18px] text-white/25 font-bold tracking-wider">???</div>
      </div>

      {/* Pull buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => handlePull(1)}
          className={cn(
            "w-[140px] h-12 bg-transparent border-[1.5px] rounded-[24px] text-foreground text-sm font-semibold cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-95",
            currency === 'gems' ? "border-[#A78BFA]" : "border-[#C9A84C]"
          )}
        >
          {currency === 'gems' ? '1회 소환 💎 10' : '1회 소환 🪙 500'}
        </button>

        <button
          onClick={() => handlePull(10)}
          className={cn(
            "w-[140px] h-12 border-none rounded-[24px] text-background text-sm font-bold cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-95",
            currency === 'gems' 
              ? "bg-[#A78BFA] shadow-[0_0_20px_rgba(167,139,250,0.35)]" 
              : "bg-[#C9A84C] shadow-[0_0_20px_rgba(201,168,76,0.35)]"
          )}
        >
          {currency === 'gems' ? '10회 💎 90' : '10회 🪙 4,500'}
        </button>
      </div>

      {currency === 'gold' && (
        <div className="text-foreground/30 text-[11px] text-center">골드 소환은 소환석 소환과 동일 확률이에요</div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[300] bg-red-500/15 backdrop-blur-md border border-red-500/30 rounded-[24px] px-5 py-2.5 text-[#FCA5A5] text-sm font-semibold whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      {/* Gacha result modal */}
      {result && (
        <GachaResultModal
          isOpen={isResultOpen}
          characters={result.characters}
          newIds={result.newIds}
          onClose={handleClose}
          onViewCollection={handleViewCollection}
        />
      )}
    </div>
  );
};

export default GachaScreen;
