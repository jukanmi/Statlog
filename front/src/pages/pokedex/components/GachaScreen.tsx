import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { pullOne, pullTen, type GachaCharacter } from '@/lib/gachaSystem';
import { syncUserToServer, encodeBitmask } from '@/lib/api';
import GachaResultModal from './GachaResultModal';

interface GachaScreenProps {
  onViewCollection: () => void;
}

const MysteryFigure: React.FC = () => (
  <svg width="100" height="130" viewBox="0 0 100 130" style={{ display: 'block' }}>
    {/* Sparkles */}
    <circle cx="10" cy="14" r="4" fill="rgba(201,168,76,0.4)" />
    <circle cx="88" cy="8"  r="3" fill="rgba(201,168,76,0.3)" />
    <circle cx="96" cy="65" r="4" fill="rgba(201,168,76,0.35)" />
    <circle cx="84" cy="120" r="3" fill="rgba(201,168,76,0.25)" />
    <circle cx="16" cy="118" r="4" fill="rgba(201,168,76,0.35)" />
    <circle cx="4"  cy="55"  r="3" fill="rgba(201,168,76,0.3)" />
    {/* Head */}
    <circle cx="50" cy="22" r="18" fill="rgba(255,255,255,0.06)" />
    {/* Neck */}
    <rect x="44" y="38" width="12" height="8" rx="4" fill="rgba(255,255,255,0.06)" />
    {/* Body */}
    <rect x="27" y="44" width="46" height="42" rx="9" fill="rgba(255,255,255,0.06)" />
    {/* Left arm */}
    <rect x="7"  y="48" width="18" height="12" rx="6" fill="rgba(255,255,255,0.06)" />
    {/* Right arm */}
    <rect x="75" y="48" width="18" height="12" rx="6" fill="rgba(255,255,255,0.06)" />
    {/* Left leg */}
    <rect x="29" y="84" width="16" height="38" rx="7" fill="rgba(255,255,255,0.06)" />
    {/* Right leg */}
    <rect x="55" y="84" width="16" height="38" rx="7" fill="rgba(255,255,255,0.06)" />
  </svg>
);

interface GachaResult {
  characters: GachaCharacter[];
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

    const { ownedCharacterIds, equippedCharacterId, user } = useUserStore.getState();
    syncUserToServer({
      gold: user.gold,
      gems: user.gems,
      owned_characters_bits: encodeBitmask(ownedCharacterIds),
      equipped_character_id: equippedCharacterId,
    });
  };

  const handleClose = () => {
    setIsResultOpen(false);
  };

  const handleViewCollection = () => {
    setIsResultOpen(false);
    onViewCollection();
  };

  const goldFormatted = gold.toLocaleString();

  return (
    <div
      style={{
        minHeight: 'calc(100dvh - 100px)',
        backgroundColor: '#0F0F1A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 20px calc(90px + env(safe-area-inset-bottom))',
        position: 'relative',
        gap: 28,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: 0, marginBottom: 6 }}>
          캐릭터 소환
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          공부하면 소환석이 쌓여요
        </p>
      </div>

      {/* Currency type toggle */}
      <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 4 }}>
        {(['gems', 'gold'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            style={{
              borderRadius: 16, padding: '6px 16px', fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: currency === c ? (c === 'gems' ? '#A78BFA' : '#C9A84C') : 'transparent',
              color: currency === c ? '#000' : 'rgba(255,255,255,0.4)',
              transition: 'all 150ms ease',
            }}
          >
            {c === 'gems' ? '💎 소환석' : '🪙 골드'}
          </button>
        ))}
      </div>

      {/* Currency row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div
          style={{
            backgroundColor: '#1A1A2E',
            borderRadius: 20,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            color: '#FFFFFF',
            fontWeight: 600,
          }}
        >
          <span>💎</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{gems}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>소환석</span>
        </div>
        <div
          style={{
            backgroundColor: '#1A1A2E',
            borderRadius: 20,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            color: '#FFFFFF',
            fontWeight: 600,
          }}
        >
          <span>🪙</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{goldFormatted}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>골드</span>
        </div>
      </div>

      {/* Gacha banner card */}
      <div
        style={{
          width: 300,
          height: 360,
          background: 'linear-gradient(145deg, #1A1A2E, #2D1B69)',
          border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 20,
          boxShadow: '0 0 40px rgba(124,58,237,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 16px 24px',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Rate badge */}
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
          ★★★ S등급 확률 3%
        </div>

        {/* Silhouette */}
        <MysteryFigure />

        {/* Mystery name */}
        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
          ???
        </div>
      </div>

      {/* Pull buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => handlePull(1)}
          style={{
            width: 140,
            height: 48,
            backgroundColor: 'transparent',
            border: `1.5px solid ${currency === 'gems' ? '#A78BFA' : '#C9A84C'}`,
            borderRadius: 24,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            transition: 'background-color 150ms ease, transform 150ms ease',
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)'; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          {currency === 'gems' ? '1회 소환  💎 10' : '1회 소환  🪙 500'}
        </button>

        <button
          onClick={() => handlePull(10)}
          style={{
            width: 140,
            height: 48,
            backgroundColor: currency === 'gems' ? '#A78BFA' : '#C9A84C',
            border: 'none',
            borderRadius: 24,
            color: '#0F0F1A',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            boxShadow: currency === 'gems'
              ? '0 0 20px rgba(167,139,250,0.35)'
              : '0 0 20px rgba(201,168,76,0.35)',
            transition: 'transform 150ms ease',
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)'; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          {currency === 'gems' ? '10회  💎 90' : '10회  🪙 4,500'}
        </button>
      </div>
      {currency === 'gold' && (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center' }}>
          골드 소환은 소환석 소환과 동일 확률이에요
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(88px + env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 300,
            backgroundColor: 'rgba(239,68,68,0.15)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 24,
            padding: '10px 20px',
            color: '#FCA5A5',
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            animation: 'toastIn 200ms ease',
          }}
        >
          {toast}
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

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
