import { useState, useRef } from 'react';
import { User, LogOut, Trash2, ChevronRight, Check, Target, Sun, Moon } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useQuestStore } from '@/store/useQuestStore';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  onClose: () => void;
  onLogout: () => void;
}

type ConfirmType = 'logout' | 'delete' | null;

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onLogout }) => {
  const { user, updateNickname, updateProfileImage, dataCollectionConsent, setConsent, theme, toggleTheme } = useUserStore();
  const { dailyStudyGoalMinutes, updateDailyStudyGoal } = useQuestStore();
  const [editingNick, setEditingNick] = useState(false);
  const [nickValue, setNickValue] = useState(user.nickname);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalValue, setGoalValue] = useState(dailyStudyGoalMinutes.toString());
  const [confirmType, setConfirmType] = useState<ConfirmType>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNickConfirm = () => {
    const trimmed = nickValue.trim().slice(0, 12);
    if (!trimmed) return;
    updateNickname(trimmed);
    setEditingNick(false);
  };

  const handleGoalConfirm = () => {
    const val = parseInt(goalValue, 10);
    if (!isNaN(val) && val > 0 && val <= 1440) {
      updateDailyStudyGoal(val);
    } else {
      setGoalValue(dailyStudyGoalMinutes.toString());
    }
    setEditingGoal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            updateProfileImage(compressedBase64);
          }
        };
        img.onerror = () => {
          alert('이미지 파일을 불러올 수 없습니다. 다른 파일을 선택해주세요.');
        };
        img.src = result;
      }
    };
    reader.onerror = () => {
      alert('파일을 읽는 중 오류가 발생했습니다.');
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmAction = () => {
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background z-[200] overflow-y-auto animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-5 py-4 pt-[calc(env(safe-area-inset-top)+16px)] border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <button
          onClick={onClose}
          className="bg-transparent border-none cursor-pointer text-foreground text-lg font-bold p-0 flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <ChevronRight size={24} className="rotate-180" /> 설정
        </button>
      </div>

      <div className="px-5 pb-16 pt-2">
        {/* ─── 테마 설정 ─── */}
        <SectionHeader text="테마" />
        <SettingRow onClick={toggleTheme}>
          {theme === 'dark' ? <Moon size={20} className="text-foreground/40" /> : <Sun size={20} className="text-foreground/40" />}
          <span className="text-foreground text-[15px] font-medium flex-1">테마 모드</span>
          <span className="text-[#C9A84C] text-[13px] font-bold">
            {theme === 'dark' ? '다크 모드' : '라이트 모드'}
          </span>
        </SettingRow>

        {/* ─── 프로필 ─── */}
        <SectionHeader text="프로필" />

        {/* Profile image */}
        <SettingRow onClick={() => fileInputRef.current?.click()}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#C9A84C] flex items-center justify-center overflow-hidden shrink-0 border border-border">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-base font-bold">
                {user.nickname[0]}
              </span>
            )}
          </div>
          <span className="text-foreground text-[15px] font-medium flex-1">프로필 사진</span>
          <span className="text-[#C9A84C] text-[13px] font-bold">변경</span>
        </SettingRow>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Nickname */}
        <SettingRow onClick={!editingNick ? () => { setNickValue(user.nickname); setEditingNick(true); } : undefined}>
          <User size={20} className="text-foreground/40" />
          <div className="flex-1 min-w-0">
            <div className="text-foreground text-[15px] font-medium">닉네임</div>
            {editingNick ? (
              <input
                value={nickValue}
                onChange={(e) => setNickValue(e.target.value.slice(0, 12))}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleNickConfirm(); }}
                className="bg-foreground/5 border border-border rounded-lg px-2.5 py-1 text-foreground text-[13px] outline-none mt-1.5 w-4/5 focus:border-[#C9A84C]/50 transition-colors"
              />
            ) : (
              <div className="text-foreground/40 text-[13px] font-medium mt-0.5">
                {user.nickname}
              </div>
            )}
          </div>
          {editingNick ? (
            <button
              onClick={handleNickConfirm}
              className="bg-[#C9A84C]/15 border-none rounded-lg p-2 cursor-pointer text-[#C9A84C] flex items-center hover:bg-[#C9A84C]/25 transition-colors"
            >
              <Check size={16} />
            </button>
          ) : (
            <ChevronRight size={18} className="text-foreground/20" />
          )}
        </SettingRow>

        {/* ─── 목표 설정 ─── */}
        <SectionHeader text="목표 설정" />

        <SettingRow onClick={!editingGoal ? () => { setGoalValue(dailyStudyGoalMinutes.toString()); setEditingGoal(true); } : undefined}>
          <Target size={20} className="text-foreground/40" />
          <div className="flex-1 min-w-0">
            <div className="text-foreground text-[15px] font-medium">일일 퀘스트 학습 목표 (분)</div>
            {editingGoal ? (
              <input
                type="number"
                min="1"
                max="1440"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleGoalConfirm(); }}
                className="bg-foreground/5 border border-border rounded-lg px-2.5 py-1 text-foreground text-[13px] outline-none mt-1.5 w-20 focus:border-[#C9A84C]/50 transition-colors"
              />
            ) : (
              <div className="text-foreground/40 text-[13px] font-medium mt-0.5">
                {dailyStudyGoalMinutes}분
              </div>
            )}
          </div>
          {editingGoal ? (
            <button
              onClick={handleGoalConfirm}
              className="bg-[#C9A84C]/15 border-none rounded-lg p-2 cursor-pointer text-[#C9A84C] flex items-center hover:bg-[#C9A84C]/25 transition-colors"
            >
              <Check size={16} />
            </button>
          ) : (
            <ChevronRight size={18} className="text-foreground/20" />
          )}
        </SettingRow>

        {/* ─── 개인정보 ─── */}
        <SectionHeader text="개인정보" />

        <SettingRow>
          <div className="flex-1 min-w-0">
            <div className="text-foreground text-[15px] font-medium">익명 데이터 수집 동의</div>
            <div className="text-foreground/40 text-[12px] font-medium mt-0.5 leading-relaxed">
              앱 개선을 위한 학습 통계(과목, 시간) 수집에 동의합니다.
            </div>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={dataCollectionConsent || false}
              onChange={(e) => setConsent(e.target.checked)}
              className="w-5 h-5 accent-[#C9A84C] cursor-pointer"
            />
          </label>
        </SettingRow>

        {/* ─── 계정 ─── */}
        <SectionHeader text="계정" />

        <SettingRow onClick={() => setConfirmType('logout')}>
          <LogOut size={20} className="text-red-500" />
          <span className="text-red-500 text-[15px] font-bold flex-1">로그아웃</span>
        </SettingRow>

        <SettingRow onClick={() => setConfirmType('delete')}>
          <Trash2 size={20} className="text-red-500" />
          <span className="text-red-500 text-[15px] font-bold flex-1">회원탈퇴</span>
        </SettingRow>

        {/* ─── 정보 ─── */}
        <SectionHeader text="정보" />

        <SettingRow>
          <span className="text-foreground text-[15px] font-medium flex-1">버전</span>
          <span className="text-foreground/30 text-[13px] font-bold tracking-tight uppercase">v1.0.0</span>
        </SettingRow>
      </div>

      {/* Confirm modal */}
      {confirmType !== null && (
        <div className="fixed inset-0 bg-black/75 z-20 flex items-center justify-center px-5 animate-in fade-in duration-200">
          <div className="bg-card rounded-[24px] p-7 border border-border max-w-[320px] w-full shadow-2xl scale-in-center">
            <div className="text-foreground text-lg font-black text-center mb-2">
              {confirmType === 'logout' ? '로그아웃 하시겠어요?' : '정말 탈퇴하시겠어요?'}
            </div>
            {confirmType === 'delete' && (
              <div className="text-foreground/40 text-[13px] font-medium text-center mb-2">
                모든 데이터가 삭제됩니다
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmType(null)}
                className="flex-1 h-12 rounded-xl cursor-pointer border border-border bg-foreground/5 text-foreground text-sm font-bold hover:bg-foreground/10 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmAction}
                className="flex-1 h-12 rounded-xl cursor-pointer border-none bg-red-500/15 text-red-500 text-sm font-black hover:bg-red-500/25 transition-colors"
              >
                {confirmType === 'logout' ? '로그아웃' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Shared sub-components ────────────────────────────────────────────────

function SectionHeader({ text }: { text: string }) {
  return (
    <div className="text-foreground/30 text-[11px] font-black tracking-[0.1em] uppercase mt-6 mb-2 ml-1">
      {text}
    </div>
  );
}

interface SettingRowProps {
  children: React.ReactNode;
  onClick?: () => void;
}

function SettingRow({ children, onClick }: SettingRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-[14px] p-4 flex items-center gap-3.5 mb-2 border border-border transition-all duration-200",
        onClick ? "cursor-pointer active:scale-[0.98] active:opacity-80" : "cursor-default"
      )}
    >
      {children}
    </div>
  );
}

export default SettingsModal;
