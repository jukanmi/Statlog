import { useState } from 'react';
import PartySubScreen from './components/PartySubScreen';
import GuildSubScreen from './components/GuildSubScreen';

type SubTab = 'party' | 'guild';

const PartyPage: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('party');

  return (
    <div style={{ backgroundColor: '#0F0F1A', minHeight: '100dvh' }}>
      {/* Tab switcher */}
      <div style={{
        backgroundColor: '#1A1A2E',
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingTop: 'env(safe-area-inset-top)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {(['party', 'guild'] as SubTab[]).map((tab) => {
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
              {tab === 'party' ? '파티' : '길드'}
            </button>
          );
        })}
      </div>

      {subTab === 'party' ? <PartySubScreen /> : <GuildSubScreen />}
    </div>
  );
};

export default PartyPage;
