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
import { useQuestStore } from './store/useQuestStore';
import { useQuizStore } from './store/useQuizStore';
import { useSocialStore } from './store/useSocialStore';
import { getUserProfile, decodeBitmask, fetchStudySessions, fetchUserQuizzes } from './lib/api';

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
          const [userData, sessions, serverQuizzes] = await Promise.all([
            getUserProfile(token),
            fetchStudySessions(),
            fetchUserQuizzes(),
          ]);

          const ownedIds = decodeBitmask(userData.owned_characters_bits ?? 7);
          useUserStore.setState((state) => ({
            user: { ...state.user, ...userData },
            ownedCharacterIds: ownedIds.length > 0 ? ownedIds : state.ownedCharacterIds,
            equippedCharacterId: userData.equipped_character_id ?? state.equippedCharacterId,
            characterExpMap: userData.character_exp_map ?? state.characterExpMap,
            lastAttendanceDate: userData.last_attendance_date ?? state.lastAttendanceDate,
          }));
          const today = new Date().toLocaleDateString('sv-SE');
          const getMondayStr = (dateStr: string) => {
            const d = new Date(dateStr);
            const day = d.getDay();
            d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
            return d.toISOString().slice(0, 10);
          };
          const thisMonday = getMondayStr(today);

          const todayMinutes = sessions
            .filter((s) => s.date === today)
            .reduce((sum, s) => sum + s.duration_minutes, 0);

          const weeklyMinutes = sessions
            .filter((s) => getMondayStr(s.date) === thisMonday)
            .reduce((sum, s) => sum + s.duration_minutes, 0);

          const lastSession = sessions[sessions.length - 1] ?? null;

          useStudyStore.setState({
            studyStreak: userData.study_streak ?? 0,
            sessions: sessions.map((s) => ({
              id: s.id,
              subject: s.subject,
              content: s.content,
              durationMinutes: s.duration_minutes,
              date: s.date,
              statGained: {},
            })),
            todayMinutes,
            todayDate: today,
            weeklyMinutes,
            weeklyDate: lastSession?.date ?? null,
          });

          if (serverQuizzes.length > 0) {
            useQuizStore.setState({
              userQuizzes: serverQuizzes.map((q: any) => ({
                id: q.id,
                createdAt: q.created_at,
                subject: q.subject,
                type: q.type,
                question: q.question,
                options: q.options ?? undefined,
                correctIndex: q.correct_index ?? undefined,
                answer: q.answer ?? undefined,
                hint: q.hint ?? undefined,
              })),
            });
          }

          handleLogin();
        } catch (error) {
          console.error('Failed to validate token:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          useUserStore.persist.clearStorage();
          useStudyStore.persist.clearStorage();
          useQuestStore.persist.clearStorage();
          useQuizStore.persist.clearStorage();
          useSocialStore.persist.clearStorage();
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

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    useUserStore.persist.clearStorage();
    useStudyStore.persist.clearStorage();
    useQuestStore.persist.clearStorage();
    useQuizStore.persist.clearStorage();
    useSocialStore.persist.clearStorage();
    setIsAuthenticated(false);
    navigate('/', { replace: true });
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
          <Route path="/dashboard" element={<DashboardPage onLogout={handleLogout} />} />
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
