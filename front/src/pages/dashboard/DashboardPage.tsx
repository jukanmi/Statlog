import { useState } from 'react';
import ProfileCard from './components/ProfileCard';
import StatRadarChart from './components/StatRadarChart';
import StudyBarChart from './components/StudyBarChart';
import SubjectStats from './components/SubjectStats';
import CurrencyCard from './components/CurrencyCard';
import RankingCard from './components/RankingCard';
import SettingsModal from './components/SettingsModal';

interface DashboardPageProps {
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div style={{ backgroundColor: '#0F0F1A', minHeight: '100dvh' }}>
      <div style={{
        padding: 16,
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        paddingBottom: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        <ProfileCard onSettingsClick={() => setShowSettings(true)} />
        <StatRadarChart />
        <StudyBarChart />
        <RankingCard />
        <SubjectStats />
        <CurrencyCard />
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onLogout={onLogout}
        />
      )}
    </div>
  );
};

export default DashboardPage;
