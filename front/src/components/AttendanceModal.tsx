import { useState } from 'react';
import { useUserStore, type AttendanceReward } from '@/store/useUserStore';
import { useStudyStore } from '@/store/useStudyStore';
import { syncUserToServer } from '@/lib/api';

interface Props {
  onClose: () => void;
}

const DAILY_REWARD: AttendanceReward = { gold: 100, gems: 1 };

const AttendanceModal: React.FC<Props> = ({ onClose }) => {
  const claimAttendance = useUserStore((s) => s.claimAttendance);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    claimAttendance();
    setClaimed(true);
    const { user } = useUserStore.getState();
    const { studyStreak } = useStudyStore.getState();
    syncUserToServer({
      gold: user.gold,
      gems: user.gems,
      last_attendance_date: new Date().toLocaleDateString('en-CA'),
      study_streak: studyStreak,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[200] px-6">
      <div className="bg-[#1A1A2E] border border-white/10 rounded-[24px] p-8 w-full max-w-[340px] text-center shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="text-[48px] mb-4">🎁</div>

        <h2 className="text-xl font-bold text-white mb-1.5">출석 보상</h2>
        <p className="text-[13px] text-white/40 mb-7">오늘도 접속했군요!</p>

        {/* Reward display */}
        <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-2xl py-5 px-6 mb-6 flex gap-6 justify-center items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <span className="text-[26px] font-bold text-[#C9A84C]">+{DAILY_REWARD.gold}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <span className="text-[26px] font-bold text-[#A78BFA]">+{DAILY_REWARD.gems}</span>
          </div>
        </div>

        {!claimed ? (
          <button
            onClick={handleClaim}
            className="w-full h-[52px] bg-[#C9A84C] text-[#0F0F1A] rounded-2xl text-base font-bold cursor-pointer shadow-[0_0_20px_rgba(201,168,76,0.35)] active:scale-95 transition-transform"
          >
            받기
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full h-[52px] bg-transparent border-[1.5px] border-white/15 rounded-2xl text-white/70 text-base font-semibold cursor-pointer active:scale-95 transition-transform"
          >
            확인
          </button>
        )}
      </div>
    </div>
  );
};

export default AttendanceModal;
