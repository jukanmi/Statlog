import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthScreen from './components/AuthScreen';
import BottomTabBar from './components/BottomTabBar';
import PlaceholderPage from './components/PlaceholderPage';
import HomePage from './pages/home/HomePage';
import PokedexPage from './pages/pokedex/PokedexPage';
import PartyPage from './pages/party/PartyPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AttendanceModal from './components/AttendanceModal';
import { useUserStore } from './store/useUserStore';
import { useStudyStore } from './store/useStudyStore';

const tabLabels: Record<Tab, string> = {
  home: '홈',
  pokedex: '도감',
  party: '파티',
  dashboard: '대시보드',
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const lastAttendanceDate = useUserStore((s) => s.lastAttendanceDate);
  const checkDayReset = useStudyStore((s) => s.checkDayReset);

  useEffect(() => {
    checkDayReset();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    const today = new Date().toISOString().slice(0, 10);
    if (lastAttendanceDate !== today) {
      setShowAttendance(true);
    }
  };

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[430px] mx-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/pokedex" element={<PokedexPage />} />
          <Route path="/party" element={<PartyPage />} />
          <Route path="/dashboard" element={<DashboardPage onLogout={() => setIsAuthenticated(false)} />} />
          <Route path="*" element={
            <div className="pb-20 pt-4">
              <PlaceholderPage title="페이지를 찾을 수 없습니다" />
            </div>
          } />
        </Routes>
      </div>
      <BottomTabBar />
      {showAttendance && <AttendanceModal onClose={() => setShowAttendance(false)} />}
    </div>
  );
};

export default App;
