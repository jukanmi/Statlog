import { useState } from 'react';
import GachaScreen from './components/GachaScreen';
import CollectionScreen from './components/CollectionScreen';

type SubTab = 'gacha' | 'collection';

const PokedexPage: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('gacha');

  return (
    <div style={{ backgroundColor: '#0F0F1A', minHeight: '100dvh' }}>
      {/* Tab switcher */}
      <div
        style={{
          backgroundColor: '#1A1A2E',
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 'env(safe-area-inset-top)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        {(['gacha', 'collection'] as SubTab[]).map((tab) => {
          const isActive = subTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              style={{
                flex: 1,
                height: 48,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #C9A84C' : '2px solid transparent',
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                fontSize: 15,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'color 150ms ease, border-color 150ms ease',
                marginBottom: -1,
              }}
            >
              {tab === 'gacha' ? '뽑기' : '도감'}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {subTab === 'gacha' ? (
        <GachaScreen onViewCollection={() => setSubTab('collection')} />
      ) : (
        <CollectionScreen />
      )}
    </div>
  );
};

export default PokedexPage;
