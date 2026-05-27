import { Swords } from 'lucide-react';

interface AuthScreenProps {
  onLogin: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const handleSocialLogin = async (provider: 'kakao' | 'google') => {
    try {
      localStorage.setItem('oauth_provider', provider);
      const redirectUri = encodeURIComponent(window.location.origin + "/auth/callback");
      const url = import.meta.env.VITE_API_URL + `/api/v1/auth/${provider}/url?redirect_uri=${redirectUri}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const data = await res.json();
      if (!data.auth_url) throw new Error('auth_url이 없습니다');
      window.location.href = data.auth_url;
    } catch (e) {
      alert(`로그인 실패: ${(e as Error).message}`);
    }
  };

  const handleKakaoLogin = () => handleSocialLogin('kakao');
  const handleGoogleLogin = () => handleSocialLogin('google');

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
