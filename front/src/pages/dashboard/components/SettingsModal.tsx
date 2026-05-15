import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Trash2, ChevronRight, Check, Target } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

interface SettingsModalProps {
  onClose: () => void;
  onLogout: () => void;
}

type ConfirmType = 'logout' | 'delete' | null;

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onLogout }) => {
  const { user, updateNickname, updateProfileImage, dailyStudyGoalMinutes, updateDailyStudyGoal } = useUserStore();
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
            // 압축하여 Base64로 변환 (0.8 품질의 JPEG)
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
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0F0F1A',
      zIndex: 200,
      overflowY: 'auto',
      animation: 'slideInRight 300ms ease',
    }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        background: '#0F0F1A',
        zIndex: 1,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← 설정
        </button>
      </div>

      <div style={{ padding: '8px 20px 60px' }}>
        {/* ─── 프로필 ─── */}
        <SectionHeader text="프로필" />

        {/* Profile image */}
        <SettingRow onClick={() => fileInputRef.current?.click()}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED, #C9A84C)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>
                {user.nickname[0]}
              </span>
            )}
          </div>
          <span style={{ color: '#fff', fontSize: 15, flex: 1 }}>프로필 사진</span>
          <span style={{ color: '#C9A84C', fontSize: 13 }}>변경</span>
        </SettingRow>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Nickname */}
        <SettingRow onClick={!editingNick ? () => { setNickValue(user.nickname); setEditingNick(true); } : undefined}>
          <User size={20} color="rgba(255,255,255,0.5)" />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 15 }}>닉네임</div>
            {editingNick ? (
              <input
                value={nickValue}
                onChange={(e) => setNickValue(e.target.value.slice(0, 12))}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleNickConfirm(); }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  marginTop: 4,
                  width: '80%',
                }}
              />
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 }}>
                {user.nickname}
              </div>
            )}
          </div>
          {editingNick ? (
            <button
              onClick={handleNickConfirm}
              style={{
                background: 'rgba(201,168,76,0.15)',
                border: 'none',
                borderRadius: 8,
                padding: '6px 10px',
                cursor: 'pointer',
                color: '#C9A84C',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Check size={16} />
            </button>
          ) : (
            <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
          )}
        </SettingRow>

        {/* ─── 목표 설정 ─── */}
        <SectionHeader text="목표 설정" />

        <SettingRow onClick={!editingGoal ? () => { setGoalValue(dailyStudyGoalMinutes.toString()); setEditingGoal(true); } : undefined}>
          <Target size={20} color="rgba(255,255,255,0.5)" />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 15 }}>일일 퀘스트 학습 목표 (분)</div>
            {editingGoal ? (
              <input
                type="number"
                min="1"
                max="1440"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleGoalConfirm(); }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  marginTop: 4,
                  width: '80px',
                }}
              />
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 }}>
                {dailyStudyGoalMinutes}분
              </div>
            )}
          </div>
          {editingGoal ? (
            <button
              onClick={handleGoalConfirm}
              style={{
                background: 'rgba(201,168,76,0.15)',
                border: 'none',
                borderRadius: 8,
                padding: '6px 10px',
                cursor: 'pointer',
                color: '#C9A84C',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Check size={16} />
            </button>
          ) : (
            <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
          )}
        </SettingRow>

        {/* ─── 계정 ─── */}
        <SectionHeader text="계정" />

        <SettingRow onClick={() => setConfirmType('logout')}>
          <LogOut size={20} color="#EF4444" />
          <span style={{ color: '#EF4444', fontSize: 15, flex: 1 }}>로그아웃</span>
        </SettingRow>

        <SettingRow onClick={() => setConfirmType('delete')}>
          <Trash2 size={20} color="#EF4444" />
          <span style={{ color: '#EF4444', fontSize: 15, flex: 1 }}>회원탈퇴</span>
        </SettingRow>

        {/* ─── 정보 ─── */}
        <SectionHeader text="정보" />

        <SettingRow>
          <span style={{ color: '#fff', fontSize: 15, flex: 1 }}>버전</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>v1.0.0</span>
        </SettingRow>
      </div>

      {/* Confirm modal */}
      {confirmType !== null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.72)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
        }}>
          <div style={{
            background: '#1A1A2E',
            borderRadius: 20,
            padding: 28,
            border: '1px solid rgba(255,255,255,0.08)',
            maxWidth: 320,
            width: '100%',
          }}>
            <div style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 8,
            }}>
              {confirmType === 'logout' ? '로그아웃 하시겠어요?' : '정말 탈퇴하시겠어요?'}
            </div>
            {confirmType === 'delete' && (
              <div style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 13,
                textAlign: 'center',
                marginBottom: 8,
              }}>
                모든 데이터가 삭제됩니다
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setConfirmType(null)}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: 14,
                }}
              >
                취소
              </button>
              <button
                onClick={handleConfirmAction}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'rgba(239,68,68,0.15)',
                  color: '#EF4444',
                  fontSize: 14,
                  fontWeight: 700,
                }}
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
    <div style={{
      color: 'rgba(255,255,255,0.4)',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      margin: '20px 0 8px',
    }}>
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
      style={{
        background: '#1A1A2E',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </div>
  );
}

export default SettingsModal;
