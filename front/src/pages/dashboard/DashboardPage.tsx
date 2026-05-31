import { useState } from 'react';
import ProfileCard from './components/ProfileCard';
import StatRadarChart from './components/StatRadarChart';
import StudyBarChart from './components/StudyBarChart';
import SubjectStats from './components/SubjectStats';
import CurrencyCard from './components/CurrencyCard';
import RankingCard from './components/RankingCard';
import SettingsModal from './components/SettingsModal';
import { downloadPortfolioPdf } from '@/lib/api';

interface DashboardPageProps {
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPortfolio = async () => {
    try {
      setIsGenerating(true);
      const blob = await downloadPortfolioPdf();
      
      // 가상 URL을 만들어 브라우저 내 다운로드 링크 생성 및 강제 클릭
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AI_Portfolio_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // 다운로드 후 클린업
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("포트폴리오 추출 실패:", error);
      alert("포트폴리오를 생성하는 도중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

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
          <button
          onClick={handleDownloadPortfolio}
          disabled={isGenerating}
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 20px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            opacity: isGenerating ? 0.7 : 1,
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s ease',
          }}
        >
          {isGenerating ? '🤖 AI가 포트폴리오를 디자인하는 중...' : '✨ 취업용 AI 포트폴리오 PDF 추출 (Premium)'}
        </button>
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
