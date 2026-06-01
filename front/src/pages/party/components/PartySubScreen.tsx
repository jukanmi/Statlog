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

const MOCK_MEMBERS = [
  { id: 'user-001', nickname: '탐험가', weeklyMinutes: 340 },
  { id: 'm2', nickname: '새벽별', weeklyMinutes: 280 },
  { id: 'm3', nickname: '코딩왕', weeklyMinutes: 210 },
  { id: 'm4', nickname: '독서가', weeklyMinutes: 185 },
];

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
  const { parties, currentPartyId, joinParty, leaveParty, createParty } = useSocialStore();
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

  // ─── My Party Detail Screen ───────────────────────────────────────────────
  if (view === 'detail' && currentParty) {
    const members = [...MOCK_MEMBERS].sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);

    return (
      <div style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            onClick={() => setView('list')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)', fontSize: 22, lineHeight: 1,
              padding: '0 12px 0 0', display: 'flex', alignItems: 'center',
            }}
          >
            ←
          </button>
          <span style={{
            flex: 1, textAlign: 'center', color: '#fff',
            fontSize: 18, fontWeight: 700, marginRight: 34,
          }}>
            {currentParty.name}
          </span>
        </div>

        {/* Hero card */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1A1A2E, #2D1B4E)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 20, padding: 20,
          }}>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{currentParty.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>{currentParty.description}</div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '16px 0' }} />
            <div style={{ display: 'flex', textAlign: 'center' }}>
              {[
                { value: `${currentParty.memberCount}/${currentParty.maxMembers}`, label: '멤버' },
                { value: `${currentParty.weeklyMinutes}분`, label: '이번주 학습' },
                { value: '#1', label: '파티 랭킹' },
              ].map((stat, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Invite link */}
        <div style={{ padding: '16px 20px 0' }}>
          <button
            onClick={async () => {
              //초대링크 수정
              const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
              const url = `${appUrl}?join=${currentParty.id}`;
              try {
                await navigator.clipboard.writeText(url);
                showToast('초대 링크가 복사됐어요!');
              } catch {
                showToast('링크 복사에 실패했어요');
              }
            }}
            style={{
              width: '100%', height: 44, borderRadius: 12, cursor: 'pointer',
              border: '1px solid rgba(167,139,250,0.3)',
              background: 'rgba(167,139,250,0.08)', color: '#A78BFA',
              fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span>🔗</span>
            <span>초대 링크 복사</span>
          </button>
        </div>

        {/* Party quests */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>파티 퀘스트</div>
          {[
            { label: '이번 주 합산 학습 1,000분', current: currentParty.weeklyMinutes, target: 1000, unit: '분' },
            {
              label: '파티원 각자 1시간 이상 학습',
              current: MOCK_MEMBERS.filter((m) => m.weeklyMinutes >= 60).length,
              target: MOCK_MEMBERS.length,
              unit: '명',
            },
            { label: '5일 연속 학습 유지', current: 3, target: 5, unit: '일' },
          ].map((quest, qi) => {
            const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));
            const done = pct >= 100;
            const claimed = claimedQuests.has(qi);
            const reward = QUEST_REWARDS[qi];

            const handleClaimQuest = () => {
              if (reward.gold > 0) updateCurrency(user.gold + reward.gold, undefined);
              if (reward.gems > 0) updateCurrency(undefined, user.gems + reward.gems);
              const statDelta: Partial<Stats> = { COL: reward.col };
              addStats(statDelta);
              setClaimedQuests((prev) => new Set([...prev, qi]));
              showToast(`보상 수령! ${reward.label} 획득`);
            };

            return (
              <div
                key={qi}
                style={{
                  background: claimed ? 'rgba(201,168,76,0.04)' : done ? 'rgba(74,222,128,0.06)' : '#1A1A2E',
                  border: `1px solid ${claimed ? 'rgba(201,168,76,0.2)' : done ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 14, padding: '14px 16px', marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: claimed ? '#C9A84C' : done ? '#4ADE80' : 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                    {claimed ? '✅ ' : done ? '✓ ' : ''}{quest.label}
                  </span>
                  <span style={{ color: done ? '#4ADE80' : 'rgba(255,255,255,0.4)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                    {quest.current}/{quest.target}{quest.unit}
                  </span>
                </div>
                <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: done && !claimed ? 10 : 0 }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: claimed ? '#C9A84C' : done ? '#4ADE80' : 'linear-gradient(90deg, #C9A84C, #E8CC7A)',
                    borderRadius: 2,
                  }} />
                </div>
                {done && !claimed && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{reward.label}</span>
                    <button
                      onClick={handleClaimQuest}
                      style={{
                        background: '#4ADE80', border: 'none', borderRadius: 8,
                        padding: '6px 14px', color: '#000', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      보상 받기
                    </button>
                  </div>
                )}
                {claimed && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>수령 완료</div>}
              </div>
            );
          })}
        </div>

        {/* Member list */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>멤버 목록</div>
          <div style={{
            background: '#1A1A2E', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
          }}>
            {members.map((member, idx) => {
              const isMe = member.id === user.id;
              const [g1, g2] = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
              return (
                <div key={member.id}>
                  {idx > 0 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0 16px' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${g1}, ${g2})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 16, fontWeight: 700,
                    }}>
                      {member.nickname[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{member.nickname}</span>
                        {isMe && (
                          <span style={{
                            background: 'rgba(201,168,76,0.15)', color: '#C9A84C',
                            borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600,
                          }}>나</span>
                        )}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                        이번주 {member.weeklyMinutes}분
                      </div>
                    </div>
                    <div style={{
                      color: idx === 0 ? '#C9A84C' : 'rgba(255,255,255,0.35)',
                      fontSize: 14, fontWeight: 700,
                    }}>
                      #{idx + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave button */}
        <div style={{ textAlign: 'center', paddingTop: 28 }}>
          <button
            onClick={() => setConfirmLeave(true)}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(239,68,68,0.65)', cursor: 'pointer', fontSize: 13,
            }}
          >
            파티 탈퇴
          </button>
        </div>

        {confirmLeave && <ConfirmModal
          text="정말 탈퇴하시겠어요?"
          sub="파티를 나가면 다시 가입해야 해요"
          onCancel={() => setConfirmLeave(false)}
          onConfirm={handleLeave}
        />}

        {toastMsg && <Toast msg={toastMsg} />}
      </div>
    );
  }

  // ─── Party List Screen ────────────────────────────────────────────────────
  const filtered = parties.filter((p) => p.name.includes(search));

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
          members={MOCK_MEMBERS}
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
