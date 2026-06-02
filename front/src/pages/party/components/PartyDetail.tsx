import React from 'react';
import { ChevronLeft, Share2, Users, Clock, Trophy, Check } from 'lucide-react';
import { Party } from '@/store/useSocialStore';
import { cn } from '@/lib/utils';
import type { Stats } from '@/types';

interface Member {
  id: string;
  nickname: string;
  weeklyMinutes: number;
}

interface QuestReward {
  gold: number;
  gems: number;
  col: number;
  label: string;
}

interface PartyDetailProps {
  party: Party;
  members: Member[];
  onBack: () => void;
  onLeaveClick: () => void;
  onClaimQuest: (index: number, reward: QuestReward) => void;
  claimedQuests: Set<number>;
  questRewards: QuestReward[];
  userId: string;
  onCopyInvite: () => void;
}

const AVATAR_GRADIENTS = [
  ['#4C1D95', '#6D28D9'],
  ['#1E3A5F', '#2563EB'],
  ['#14532D', '#16A34A'],
  ['#7C2D12', '#EA580C'],
];

const PartyDetail: React.FC<PartyDetailProps> = ({
  party,
  members,
  onBack,
  onLeaveClick,
  onClaimQuest,
  claimedQuests,
  questRewards,
  userId,
  onCopyInvite,
}) => {
  const sortedMembers = [...members].sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);

  const quests = [
    { label: '이번 주 합산 학습 1,000분', current: party.weeklyMinutes, target: 1000, unit: '분' },
    {
      label: '파티원 각자 1시간 이상 학습',
      current: members.filter((m) => m.weeklyMinutes >= 60).length,
      target: members.length,
      unit: '명',
    },
    { label: '5일 연속 학습 유지', current: 3, target: 5, unit: '일' },
  ];

  return (
    <div className="pb-24 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center px-5 py-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <button
          onClick={onBack}
          className="bg-transparent border-none cursor-pointer text-foreground/60 p-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <span className="flex-1 text-center text-foreground text-lg font-black mr-8">
          {party.name}
        </span>
      </div>

      {/* Hero card */}
      <div className="p-5">
        <div className="bg-gradient-to-br from-card to-[#2D1B4E] border border-purple-500/30 rounded-[24px] p-6 shadow-xl">
          <h2 className="text-foreground text-xl font-black m-0">{party.name}</h2>
          <p className="text-foreground/50 text-[13px] font-medium mt-1.5 leading-relaxed">{party.description}</p>
          
          <div className="h-px bg-foreground/5 my-5" />
          
          <div className="grid grid-cols-3 text-center">
            {[
              { value: `${party.memberCount}/${party.maxMembers}`, label: '멤버', icon: <Users size={14} className="mb-1 mx-auto text-[#A78BFA]" /> },
              { value: `${party.weeklyMinutes}분`, label: '이번주 학습', icon: <Clock size={14} className="mb-1 mx-auto text-[#C9A84C]" /> },
              { value: '#1', label: '파티 랭킹', icon: <Trophy size={14} className="mb-1 mx-auto text-yellow-500" /> },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col">
                {stat.icon}
                <div className="text-foreground text-base font-black tabular-nums">{stat.value}</div>
                <div className="text-foreground/30 text-[10px] font-bold mt-1 uppercase tracking-tighter">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite link */}
      <div className="px-5 pb-6">
        <button
          onClick={onCopyInvite}
          className="w-full h-12 bg-[#A78BFA]/10 border border-[#A78BFA]/30 rounded-xl text-[#A78BFA] text-sm font-black flex items-center justify-center gap-2 hover:bg-[#A78BFA]/20 active:scale-95 transition-all"
        >
          <Share2 size={18} />
          초대 링크 복사
        </button>
      </div>

      {/* Party quests */}
      <div className="px-5 pb-8">
        <h3 className="text-foreground text-base font-black mb-4 flex items-center gap-2">
          ⚔️ 파티 퀘스트
        </h3>
        <div className="flex flex-col gap-3">
          {quests.map((quest, qi) => {
            const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));
            const isDone = pct >= 100;
            const isClaimed = claimedQuests.has(qi);
            const reward = questRewards[qi];

            return (
              <div
                key={qi}
                className={cn(
                  "rounded-2xl p-4 border transition-all duration-300",
                  isClaimed 
                    ? "bg-[#C9A84C]/5 border-[#C9A84C]/20 opacity-80" 
                    : isDone 
                      ? "bg-green-500/5 border-green-500/20 shadow-[0_0_15px_rgba(74,222,128,0.05)]" 
                      : "bg-card border-border"
                )}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className={cn(
                    "text-[13px] font-bold flex items-center gap-1.5",
                    isClaimed ? "text-[#C9A84C]" : isDone ? "text-[#4ADE80]" : "text-foreground/80"
                  )}>
                    {isClaimed ? <Check size={14} /> : isDone ? <Check size={14} /> : null}
                    {quest.label}
                  </span>
                  <span className={cn(
                    "text-[11px] font-black tabular-nums",
                    isDone ? "text-[#4ADE80]" : "text-foreground/30"
                  )}>
                    {quest.current} / {quest.target}{quest.unit}
                  </span>
                </div>
                
                <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden mb-3">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      isClaimed ? "bg-[#C9A84C]" : isDone ? "bg-[#4ADE80]" : "bg-gradient-to-r from-[#C9A84C] to-[#E8CC7A]"
                    )} 
                    style={{ width: `${pct}%` }} 
                  />
                </div>

                {isDone && !isClaimed && (
                  <div className="flex items-center justify-between mt-4 bg-foreground/5 rounded-lg p-2.5 border border-border">
                    <span className="text-foreground/40 text-[11px] font-bold">{reward.label}</span>
                    <button
                      onClick={() => onClaimQuest(qi, reward)}
                      className="bg-[#4ADE80] border-none rounded-lg px-4 py-1.5 text-background text-[11px] font-black cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-md shadow-green-500/20"
                    >
                      보상 받기
                    </button>
                  </div>
                )}
                {isClaimed && (
                  <div className="text-[#C9A84C] text-[10px] font-black uppercase tracking-widest text-center mt-1">
                    Reward Claimed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Member list */}
      <div className="px-5">
        <h3 className="text-foreground text-base font-black mb-3 flex items-center gap-2">
          👥 멤버 목록
        </h3>
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-inner">
          {sortedMembers.map((member, idx) => {
            const isMe = member.id === userId;
            const [g1, g2] = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
            return (
              <div key={member.id} className="group">
                {idx > 0 && <div className="mx-4 border-t border-border" />}
                <div className="flex items-center p-4 gap-4 transition-colors group-hover:bg-foreground/[0.02]">
                  <div 
                    className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-white text-base font-black shadow-lg border-2 border-white/20"
                    style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                  >
                    {member.nickname[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground text-[14px] font-bold truncate">{member.nickname}</span>
                      {isMe && (
                        <span className="bg-[#C9A84C]/15 text-[#C9A84C] rounded-full px-2 py-0.5 text-[9px] font-black border border-[#C9A84C]/20">ME</span>
                      )}
                    </div>
                    <div className="text-foreground/30 text-[11px] font-bold mt-0.5 tabular-nums">
                      이번 주 {member.weeklyMinutes.toLocaleString()}분
                    </div>
                  </div>
                  <div className={cn(
                    "text-[13px] font-black italic tracking-tighter",
                    idx === 0 ? "text-[#C9A84C]" : "text-foreground/10"
                  )}>
                    RANK #{idx + 1}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leave button */}
        <div className="mt-10 text-center">
          <button
            onClick={onLeaveClick}
            className="bg-transparent border-none text-red-500/40 hover:text-red-500 text-[13px] font-bold cursor-pointer transition-colors p-2"
          >
            파티 탈퇴하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartyDetail;
