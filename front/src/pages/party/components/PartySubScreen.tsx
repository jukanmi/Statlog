import { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useSocialStore } from '@/store/useSocialStore';
import type { Stats } from '@/types';
import PartyList from './PartyList';
import PartyDetail from './PartyDetail';
import CreatePartyModal from './CreatePartyModal';
import { cn } from '@/lib/utils';

const PARTY_TAGS = ['수학', '영어', '과학', '국어', '사회', '프로그래밍', '기타'];
const MAX_OPTIONS = [2, 3, 4, 5, 6, 8];


interface QuestReward {
  gold: number;
  gems: number;
  col: number;
  label: string;
}

const QUEST_REWARDS: QuestReward[] = [
  { gold: 200, gems: 0, col: 3, label: '골드 200 + COL +3' },
  { gold: 100, gems: 2, col: 2, label: '골드 100 + 젬 2 + COL +2' },
  { gold: 0,   gems: 5, col: 2, label: '젬 5 + COL +2' },
];

type View = 'list' | 'detail';

const PartySubScreen: React.FC = () => {
  const { user, updateCurrency, addStats } = useUserStore();
  const { parties, currentPartyId, currentPartyMembers, joinParty, leaveParty, createParty } = useSocialStore();
  const [view, setView] = useState<View>(currentPartyId ? 'detail' : 'list');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [claimedQuests, setClaimedQuests] = useState<Set<number>>(new Set());

  // Create modal fields
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cMax, setCMax] = useState(4);
  const [cTags, setCTags] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const currentParty = currentPartyId ? parties.find((p) => p.id === currentPartyId) : null;

  const handleJoin = (id: string) => {
    if (currentPartyId) { showToast('먼저 현재 파티에서 탈퇴하세요'); return; }
    const p = parties.find((x) => x.id === id)!;
    if (p.memberCount >= p.maxMembers) { showToast('파티가 가득 찼어요'); return; }
    joinParty(id);
    setView('detail');
    showToast('파티에 가입했어요! 🎉');
  };

  const handleLeave = () => {
    leaveParty();
    setConfirmLeave(false);
    setView('list');
    showToast('파티를 탈퇴했어요');
  };

  const handleCreate = () => {
    if (!cName.trim()) return;
    createParty({ name: cName.trim(), description: cDesc.trim(), maxMembers: cMax, weeklyMinutes: 0, tags: cTags });
    setShowModal(false);
    setCName(''); setCDesc(''); setCMax(4); setCTags([]);
    setView('detail');
    showToast('파티가 생성됐어요! ⚔️');
  };

  const toggleTag = (tag: string) => {
    if (cTags.includes(tag)) setCTags(cTags.filter((t) => t !== tag));
    else if (cTags.length < 3) setCTags([...cTags, tag]);
  };

  const handleClaimQuest = (index: number, reward: QuestReward) => {
    if (reward.gold > 0) updateCurrency(user.gold + reward.gold, undefined);
    if (reward.gems > 0) updateCurrency(undefined, user.gems + reward.gems);
    addStats({ COL: reward.col } as Partial<Stats>);
    setClaimedQuests((prev) => new Set([...prev, index]));
    showToast(`보상 수령! ${reward.label} 획득`);
  };

  // ─── Party List Screen ────────────────────────────────────────────────────
  return (
    <div className="relative">
      {view === 'list' ? (
        <PartyList
          parties={parties}
          search={search}
          onSearchChange={setSearch}
          onJoin={handleJoin}
          onCreateClick={() => setShowModal(true)}
          onViewDetail={() => setView('detail')}
          hasJoined={!!currentPartyId}
        />
      ) : currentParty ? (
        <PartyDetail
          party={currentParty}
          members={currentPartyMembers}
          onBack={() => setView('list')}
          onLeaveClick={() => setConfirmLeave(true)}
          onClaimQuest={handleClaimQuest}
          claimedQuests={claimedQuests}
          questRewards={QUEST_REWARDS}
          userId={user.id}
          onCopyInvite={async () => {
            const url = `${window.location.origin}?join=${currentParty.id}`;
            try {
              await navigator.clipboard.writeText(url);
              showToast('초대 링크가 복사됐어요!');
            } catch {
              showToast('링크 복사에 실패했어요');
            }
          }}
        />
      ) : (
        <div className="p-20 text-center text-white/40 font-bold">파티 정보를 불러올 수 없어요</div>
      )}

      {/* Create Modal */}
      <CreatePartyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
        name={cName}
        onNameChange={setCName}
        description={cDesc}
        onDescriptionChange={setCDesc}
        maxMembers={cMax}
        onMaxChange={setCMax}
        tags={cTags}
        onToggleTag={toggleTag}
        allTags={PARTY_TAGS}
        maxOptions={MAX_OPTIONS}
      />

      {/* Confirm Leave Modal */}
      {confirmLeave && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-5 bg-black/80 animate-in fade-in duration-200">
          <div className="bg-[#1A1A2E] border border-white/10 rounded-[32px] p-8 max-w-[320px] w-full text-center shadow-2xl">
            <h3 className="text-white text-lg font-black mb-2">파티를 탈퇴하시겠어요?</h3>
            <p className="text-white/40 text-[13px] font-medium mb-8">기존 파티 기여도가 초기화됩니다.</p>
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

export default PartySubScreen;
