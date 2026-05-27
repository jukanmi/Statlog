import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthScreen from './components/AuthScreen';
import AuthCallback from './pages/auth/AuthCallback';
import BottomTabBar, { type Tab } from './components/BottomTabBar';
import PlaceholderPage from './components/PlaceholderPage';
import HomePage from './pages/home/HomePage';
import PokedexPage from './pages/pokedex/PokedexPage';
import PartyPage from './pages/party/PartyPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AttendanceModal from './components/AttendanceModal';
import ConsentModal from './components/ConsentModal';
import { useUserStore } from './store/useUserStore';
import { useStudyStore } from './store/useStudyStore';
import { getUserProfile } from './lib/api';

const tabLabels: Record<Tab, string> = {
  home: '홈',
  pokedex: '도감',
  party: '파티',
  dashboard: '대시보드',
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showAttendance, setShowAttendance] = useState(false);
  const lastAttendanceDate = useUserStore((s) => s.lastAttendanceDate);
  const checkDayReset = useStudyStore((s) => s.checkDayReset);
  const navigate = useNavigate();

  useEffect(() => {
    checkDayReset();
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await getUserProfile(token);
          // 백엔드에서 받아온 유저 정보로 스토어 업데이트
          useUserStore.setState((state) => ({
            user: { ...state.user, ...userData }
          }));
          handleLogin();
        } catch (error) {
          console.error('Failed to validate token:', error);
          // 토큰이 만료되었거나 유효하지 않으면 로컬에서 제거
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setIsInitializing(false);
    };

    initializeAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    const today = new Date().toLocaleDateString('en-CA');
    if (lastAttendanceDate !== today) {
      setShowAttendance(true);
    }
    navigate('/home', { replace: true });
  };

  useEffect(() => {
    const handleAuthSuccess = () => handleLogin();
    window.addEventListener('auth_success', handleAuthSuccess);
    return () => window.removeEventListener('auth_success', handleAuthSuccess);
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[430px] mx-auto">
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<AuthScreen onLogin={handleLogin} />} />
          </Routes>
        </div>
      </div>
    );
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
      <ConsentModal />
    </div>
  );
};

export default App;
