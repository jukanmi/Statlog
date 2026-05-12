import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../../store/useUserStore';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state') || '';
    const provider = localStorage.getItem('oauth_provider') || 'kakao';

    if (code) {
      fetch(`http://localhost:8000/auth/${provider}/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirect_uri: window.location.origin + '/auth/callback',
          state: stateParam,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('로그인에 실패했습니다.');
          return res.json();
        })
        .then((data) => {
          localStorage.setItem('access_token', data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
          }
          if (data.user) {
            useUserStore.setState((state) => ({
              user: { ...state.user, ...data.user }
            }));
          }
          
          window.dispatchEvent(new Event('auth_success'));
          navigate('/home', { replace: true });
        })
        .catch((err) => {
          console.error(err);
          setError(err.message);
        });
    } else {
      setError('인증 코드가 없습니다.');
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <p className="text-destructive font-semibold">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-muted-foreground font-medium animate-pulse">로그인 처리 중입니다...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
