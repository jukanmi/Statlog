import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthScreen from './components/AuthScreen';
import AuthCallback from './pages/auth/AuthCallback';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
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

const App: React.FC = () => {
  const { isAuthenticated, login, logout, lastAttendanceDate, theme } = useUserStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [showAttendance, setShowAttendance] = useState(false);
  const checkDayReset = useStudyStore((s) => s.checkDayReset);
  const navigate = useNavigate();

  useEffect(() => {
    checkDayReset();
  }, [checkDayReset]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // 👥 [딥링크 차단 복구] 인증 상태가 완료(True)되는 즉시 주소창 파라미터를 파싱하여 파티 결합 통제
  useEffect(() => {
    if (isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('invite_code');
      const joinId = params.get('join');

      if (inviteCode || joinId) {
        // 처리 후 루프 방지를 위해 주소창 청소 및 초기화
        window.history.replaceState({}, document.title, window.location.pathname);
        
        (async () => {
          try {
            if (inviteCode) {
              await useSocialStore.getState().joinPartyByInvite(inviteCode);
              alert('🎉 초대 코드가 인증되어 해당 공부 파티에 자동으로 합류했습니다!');
            } else if (joinId) {
              await useSocialStore.getState().joinParty(joinId);
              alert('🎉 파티 ID 식별을 통해 해당 공부 파티 가입에 성공했습니다!');
            }
            // 가입 후 내 파티 세션 데이터를 데이터베이스 서버풀로부터 리로드 정산
            await useSocialStore.getState().loadMyParty();
          } catch (error: any) {
            alert(`❌ 파티 합류에 실패했습니다: ${error.message || '만료되었거나 잘못된 링크입니다.'}`);
          }
        })();
      } else {
        // 일반 접근 시에도 내 활성 파티 데이터 로드 가동
        useSocialStore.getState().loadMyParty();
      }
    }
  }, [isAuthenticated]);

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

          login();
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

  const handleLoginSuccess = () => {
    login();
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
    logout();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const handleAuthSuccess = () => handleLoginSuccess();
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


  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={
          <div className="min-h-screen bg-background">
            <div className="max-w-[430px] mx-auto">
              <AuthScreen onLogin={handleLoginSuccess} />
            </div>
          </div>
        } />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes with Layout */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
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
        </Route>
      </Routes>

      {showAttendance && <AttendanceModal onClose={() => setShowAttendance(false)} />}
      <ConsentModal />
    </>
  );
};

export default App;