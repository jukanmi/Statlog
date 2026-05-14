import { Settings } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

interface ProfileCardProps {
  onSettingsClick: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ onSettingsClick }) => {
  const { user } = useUserStore();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1A1A2E, #2D1B4E)',
      border: '1px solid rgba(124,58,237,0.3)',
      borderRadius: 20,
      padding: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      {/* Avatar */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #7C3AED, #C9A84C)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt="profile"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>
            {user.nickname[0]}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{user.nickname}</span>
          <span style={{
            background: 'rgba(124,58,237,0.2)',
            color: '#A78BFA',
            borderRadius: 20,
            padding: '3px 10px',
            fontSize: 12,
            fontWeight: 600,
          }}>
            Lv.{user.level}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            🪙 {user.gold.toLocaleString()}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            💎 {user.gems}
          </span>
        </div>
      </div>

      {/* Settings button */}
      <button
        onClick={onSettingsClick}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.4)',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Settings size={22} />
      </button>
    </div>
  );
};

export default ProfileCard;
