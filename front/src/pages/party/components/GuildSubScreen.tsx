import { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useSocialStore } from '@/store/useSocialStore';
import type { GuildMember } from '@/store/useSocialStore';
import GuildList from './GuildList';
import GuildDetail from './GuildDetail';
import CreateGuildModal from './CreateGuildModal';
import { cn } from '@/lib/utils';

const MAX_OPTIONS = [10, 15, 20, 25, 30];

const MOCK_GUILD_MEMBERS: GuildMember[] = [
  { id: 'user-001', nickname: '탐험가', weeklyMinutes: 340, totalMinutes: 12400, grade: 'guild_master' },
  { id: 'm2', nickname: '새벽별', weeklyMinutes: 280, totalMinutes: 8900, grade: 'officer' },
  { id: 'm3', nickname: '코딩왕', weeklyMinutes: 210, totalMinutes: 6700, grade: 'member' },
  { id: 'm4', nickname: '독서가', weeklyMinutes: 185, totalMinutes: 5200, grade: 'member' },
  { id: 'm5', nickname: '야간탐험가', weeklyMinutes: 160, totalMinutes: 4100, grade: 'member' },
];

type GuildTab = 'home' | 'ranking' | 'rewards';
type View = 'list' | 'detail';

const WEEKLY_REWARDS = [
  { id: 'r1', target: 100, label: '100분 달성', gold: 50, gems: 0, rewardText: '골드 50', icon: '🪙' },
  { id: 'r2', target: 200, label: '200분 달성', gold: 150, gems: 0, rewardText: '골드 150', icon: '💰' },
  { id: 'r3', target: 340, label: '340분 달성', gold: 0, gems: 5, rewardText: '젬 5', icon: '💎' },
  { id: 'r4', target: 600, label: '600분 달성', gold: 200, gems: 10, rewardText: '골드 200 + 젬 10', icon: '🏆' },
];

const GuildSubScreen: React.FC = () => {
  const { user, updateCurrency } = useUserStore();
  const { guilds, currentGuildId, joinGuild, leaveGuild, createGuild } = useSocialStore();
  const actualWeeklyMinutes = useStudyStore((s) => s.weeklyMinutes);
  const [view, setView] = useState<View>(currentGuildId ? 'detail' : 'list');
  const [showModal, setShowModal] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [guildTab, setGuildTab] = useState<GuildTab>('home');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [claimedRewards, setClaimedRewards] = useState<Set<string>>(new Set());

  // Create modal fields
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cMax, setCMax] = useState(20);
  const [search, setSearch] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const currentGuild = currentGuildId ? guilds.find((g) => g.id === currentGuildId) : null;

  const handleJoin = (id: string) => {
    if (currentGuildId) { showToast('먼저 현재 길드에서 탈퇴하세요'); return; }
    joinGuild(id);
    setView('detail');
    showToast('길드에 가입했어요! 🏰');
  };

  const handleLeave = () => {
    leaveGuild();
    setConfirmLeave(false);
    setGuildTab('home');
    setView('list');
    showToast('길드를 탈퇴했어요');
  };

  const handleCreate = () => {
    if (!cName.trim()) return;
    createGuild({ name: cName.trim(), description: cDesc.trim(), maxMembers: cMax, weeklyMinutes: 0, level: 1 });
    setShowModal(false);
    setCName(''); setCDesc(''); setCMax(20);
    setView('detail');
    showToast('길드가 생성되었어요! 🏰');
  };

  const handleClaimReward = (rewardId: string) => {
    const reward = WEEKLY_REWARDS.find((r) => r.id === rewardId);
    if (!reward) return;
    const newGold = reward.gold > 0 ? user.gold + reward.gold : undefined;
    const newGems = reward.gems > 0 ? user.gems + reward.gems : undefined;
    updateCurrency(newGold, newGems);
    setClaimedRewards((prev) => new Set([...prev, rewardId]));
    showToast(`보상 수령! ${reward.rewardText} 획득 🎁`);
  };

  return (
    <div className="relative">
      {view === 'list' ? (
        <GuildList
          guilds={guilds}
          search={search}
          onSearchChange={setSearch}
          onJoin={handleJoin}
          onCreateClick={() => setShowModal(true)}
          onViewDetail={() => setView('detail')}
          hasJoined={!!currentGuildId}
        />
      ) : currentGuild ? (
        <GuildDetail
          guild={currentGuild}
          members={MOCK_GUILD_MEMBERS}
          onBack={() => setView('list')}
          onLeaveClick={() => setConfirmLeave(true)}
          activeTab={guildTab}
          onTabChange={setGuildTab}
          onClaimReward={handleClaimReward}
          claimedRewards={claimedRewards}
          userId={user.id}
          userWeeklyMinutes={actualWeeklyMinutes}
        />
      ) : (
        <div className="p-20 text-center text-white/40 font-bold">길드 정보를 불러올 수 없어요</div>
      )}

      {/* Create Modal */}
      <CreateGuildModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
        name={cName}
        onNameChange={setCName}
        description={cDesc}
        onDescriptionChange={setCDesc}
        maxMembers={cMax}
        onMaxChange={setCMax}
        maxOptions={MAX_OPTIONS}
      />

      {/* Confirm Leave Modal */}
      {confirmLeave && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-5 bg-black/80 animate-in fade-in duration-200">
          <div className="bg-[#1A1A2E] border border-white/10 rounded-[32px] p-8 max-w-[320px] w-full text-center shadow-2xl">
            <h3 className="text-white text-lg font-black mb-2">길드를 탈퇴하시겠어요?</h3>
            <p className="text-white/40 text-[13px] font-medium mb-8">기존 길드 기여도가 소멸됩니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLeave(false)}
                className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLeave}
                className="flex-1 h-12 bg-red-500/15 border-none rounded-xl text-red-500 text-sm font-black hover:bg-red-500/25 transition-colors"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#0F0F1A]/95 border border-white/10 rounded-2xl px-6 py-3 text-white text-sm z-[400] shadow-2xl animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </div>
  );
};

export default GuildSubScreen;
