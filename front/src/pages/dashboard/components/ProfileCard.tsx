import { Settings } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

interface ProfileCardProps {
  onSettingsClick: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ onSettingsClick }) => {
  const { user } = useUserStore();

  return (
    <div className="bg-card border border-purple-500/30 rounded-[20px] p-5 flex items-center gap-4 shadow-xl">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full shrink-0 bg-gradient-to-br from-[#7C3AED] to-[#C9A84C] flex items-center justify-center overflow-hidden border-2 border-border">
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt="profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white text-[28px] font-bold">
            {user.nickname[0]}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-foreground text-xl font-bold truncate">{user.nickname}</span>
          <span className="bg-purple-500/20 text-[#A78BFA] rounded-full px-2.5 py-0.5 text-[12px] font-bold border border-purple-500/20">
            Lv.{user.level}
          </span>
        </div>
        <div className="flex gap-4 mt-1.5">
          <span className="text-foreground/50 text-[13px] font-medium flex items-center gap-1">
            🪙 {user.gold.toLocaleString()}
          </span>
          <span className="text-foreground/50 text-[13px] font-medium flex items-center gap-1">
            💎 {user.gems}
          </span>
        </div>
      </div>

      {/* Settings button */}
      <button
        onClick={onSettingsClick}
        className="bg-transparent border-none cursor-pointer text-foreground/40 p-2 flex items-center hover:text-foreground/70 hover:bg-foreground/5 rounded-full transition-all"
      >
        <Settings size={22} />
      </button>
    </div>
  );
};

export default ProfileCard;
