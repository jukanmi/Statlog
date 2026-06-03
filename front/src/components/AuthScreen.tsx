import { Swords } from 'lucide-react';

interface AuthScreenProps {
  onLogin: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleLogin = async (provider: 'kakao' | 'google') => {
    try {
      localStorage.setItem('oauth_provider', provider);
      const redirectUri = encodeURIComponent(
        (import.meta.env.VITE_REDIRECT_BASE_URL || window.location.origin) + "/auth/callback"
      );
      const res = await fetch(`${baseUrl}/api/v1/auth/${provider}/url?redirect_uri=${redirectUri}`);
      if (!res.ok) throw new Error('인증 URL을 가져오는데 실패했습니다.');
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (err) {
      console.error(err);
      alert('로그인 준비 중 오류가 발생했습니다.');
    }
  };

  const handleKakaoLogin = () => handleLogin('kakao');
  const handleGoogleLogin = () => handleLogin('google');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[430px] space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Swords className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Study RPG
          </h1>
          <p className="text-muted-foreground text-sm">
            공부로 성장하는 나만의 모험
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-5">
          <button
            onClick={handleKakaoLogin}
            className="w-full bg-[#FEE500] text-[#000000] font-semibold py-3 rounded-md text-sm hover:brightness-95 transition-all flex items-center justify-center gap-2"
          >
            카카오 로그인
          </button>
          
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black border border-gray-300 font-semibold py-3 rounded-md text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            구글 로그인
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">또는</span>
            </div>
          </div>

          <button
            onClick={onLogin}
            className="w-full border border-border text-muted-foreground font-medium py-3 rounded-md text-sm hover:text-foreground hover:border-primary/40 transition-all"
          >
            게스트로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
