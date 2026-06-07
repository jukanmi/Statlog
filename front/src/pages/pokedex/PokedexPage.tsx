import { useState } from 'react';
import GachaScreen from './components/GachaScreen';
import CollectionScreen from './components/CollectionScreen';
import { cn } from '@/lib/utils';

type SubTab = 'gacha' | 'collection';

const PokedexPage: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('gacha');

  const tabs: { key: SubTab; label: string }[] = [
    { key: 'gacha', label: '소환' },
    { key: 'collection', label: '도감' },
  ];

  return (
    <div className="bg-background min-h-[100dvh]">
      {/* Tab switcher */}
      <div className="bg-card/80 backdrop-blur-md flex border-b border-border pt-[env(safe-area-inset-top)] sticky top-0 z-50">
        {tabs.map((tab) => {
          const isActive = subTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={cn(
                "flex-1 h-12 bg-transparent border-none border-b-2 text-sm font-semibold transition-all duration-200 relative",
                isActive 
                  ? "text-foreground border-[#C9A84C]" 
                  : "text-foreground/40 border-transparent hover:text-foreground/60"
              )}
            >
              {tab.label}
              {isActive && (
                <div className="absolute inset-0 bg-[#C9A84C]/5 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="animate-in fade-in duration-500">
        {subTab === 'gacha' ? (
          <GachaScreen onViewCollection={() => setSubTab('collection')} />
        ) : (
          <CollectionScreen />
        )}
      </div>
    </div>
  );
};

export default PokedexPage;
