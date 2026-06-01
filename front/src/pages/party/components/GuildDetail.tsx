import React from 'react';
import { ChevronLeft, Shield, Users, Clock, Trophy, Check, ArrowRight } from 'lucide-react';
import { Guild, GuildMember } from '@/store/useSocialStore';
import { cn } from '@/lib/utils';

interface GuildDetailProps {
  guild: Guild;
  members: GuildMember[];
  onBack: () => void;
  onLeaveClick: () => void;
  activeTab: 'home' | 'ranking' | 'rewards';
  onTabChange: (tab: 'home' | 'ranking' | 'rewards') => void;
  onClaimReward: (id: string) => void;
  claimedRewards: Set<string>;
  userId: string;
  userWeeklyMinutes: number;
}

const AVATAR_GRADIENTS = [
  ['#4C1D95', '#6D28D9'],
  ['#1E3A5F', '#2563EB'],
  ['#14532D', '#16A34A'],
  ['#7C2D12', '#EA580C'],
  ['#1E3A5F', '#0E7490'],
];

const GRADE_LABELS: Record<GuildMember['grade'], string> = {
  guild_master: '길드장',
  officer: '부길드장',
  member: '멤버',
};

const WEEKLY_REWARDS = [
  { id: 'r1', target: 100, label: '100분 달성', gold: 50, gems: 0, rewardText: '골드 50', icon: '🪙' },
  { id: 'r2', target: 200, label: '200분 달성', gold: 150, gems: 0, rewardText: '골드 150', icon: '💰' },
  { id: 'r3', target: 340, label: '340분 달성', gold: 0, gems: 5, rewardText: '젬 5', icon: '💎' },
  { id: 'r4', target: 600, label: '600분 달성', gold: 200, gems: 10, rewardText: '골드 200 + 젬 10', icon: '🏆' },
];

const GuildDetail: React.FC<GuildDetailProps> = ({
  guild,
  members,
  onBack,
  onLeaveClick,
  activeTab,
  onTabChange,
  onClaimReward,
  claimedRewards,
  userId,
  userWeeklyMinutes,
}) => {
  const sortedMembers = [...members].sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);

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
          {guild.name}
        </span>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto scrollbar-none">
        {(['home', 'ranking', 'rewards'] as const).map((tab) => {
          const labels = { home: '홈', ranking: '주간 랭킹', rewards: '주간 보상' };
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                "flex-shrink-0 px-5 py-2 rounded-full text-[13px] font-black transition-all",
                active 
                  ? "bg-[#C9A84C] text-background" 
                  : "bg-foreground/5 text-foreground/40 border border-border hover:text-foreground/60"
              )}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Home Tab */}
      {activeTab === 'home' && (
        <div className="px-5 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-[#1B1B3A] to-[#2D1B69] border border-indigo-500/30 rounded-[28px] p-6 shadow-2xl relative overflow-hidden mb-6">
            <div className="flex items-center gap-2.5 mb-2">
              <h2 className="text-white text-2xl font-black m-0 tracking-tight">{guild.name}</h2>
              <span className="bg-[#A78BFA]/20 text-[#A78BFA] px-2.5 py-0.5 rounded-lg text-xs font-black border border-[#A78BFA]/20">
                LV.{guild.level}
              </span>
            </div>
            <p className="text-white/40 text-[13px] font-medium leading-relaxed max-w-[240px]">{guild.description}</p>
            
            <div className="h-px bg-white/5 my-6" />
            
            <div className="grid grid-cols-3 text-center gap-2">
              {[
                { value: `${guild.memberCount}/${guild.maxMembers}`, label: '멤버', color: 'text-indigo-400' },
                { value: `${guild.weeklyMinutes.toLocaleString()}분`, label: '이번주 학습', color: 'text-emerald-400' },
                { value: `${(guild.weeklyMinutes * 6.5).toLocaleString()}분`, label: '누적 학습', color: 'text-amber-400' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className={cn("text-base font-black tabular-nums", stat.color)}>{stat.value}</div>
                  <div className="text-white/30 text-[10px] font-bold mt-1 uppercase tracking-tighter">{stat.label}</div>
                </div>
              ))}
            </div>
            
            {/* Decoration */}
            <Shield className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32 rotate-12" />
          </div>

          <h3 className="text-foreground text-base font-black mb-4 flex items-center gap-2">
            👥 주요 멤버
          </h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
            {sortedMembers.slice(0, 5).map((member, idx) => {
              const isMe = member.id === userId;
              const [g1, g2] = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
              return (
                <div key={member.id} className="group">
                  {idx > 0 && <div className="mx-4 border-t border-border" />}
                  <div className="flex items-center p-4 gap-3.5 transition-colors group-hover:bg-foreground/[0.02]">
                    <div 
                      className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-[15px] font-black border-2 border-white/20"
                      style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                    >
                      {member.nickname[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-foreground text-sm font-bold truncate">{member.nickname}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                          member.grade === 'guild_master' ? "bg-purple-500/20 text-purple-500 border border-purple-500/20" :
                          member.grade === 'officer' ? "bg-blue-500/20 text-blue-500 border border-blue-500/20" :
                          "bg-foreground/5 text-foreground/40 border border-border"
                        )}>
                          {GRADE_LABELS[member.grade]}
                        </span>
                        {isMe && <span className="bg-[#C9A84C]/15 text-[#C9A84C] px-1.5 py-0.5 rounded-full text-[9px] font-black">ME</span>}
                      </div>
                    </div>
                    <div className="text-foreground/40 text-xs font-bold tabular-nums">
                      {member.weeklyMinutes.toLocaleString()}분
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onLeaveClick}
            className="w-full py-4 text-red-500/40 hover:text-red-500 text-[13px] font-bold transition-colors"
          >
            길드 탈퇴하기
          </button>
        </div>
      )}

      {/* Ranking Tab */}
      {activeTab === 'ranking' && (
        <div className="px-5 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center px-4 py-3 bg-foreground/5 border-b border-border">
              <span className="w-10 text-[11px] font-black text-foreground/30 uppercase">순위</span>
              <span className="flex-1 text-[11px] font-black text-foreground/30 uppercase">길드원</span>
              <span className="text-[11px] font-black text-foreground/30 uppercase">주간 학습</span>
            </div>
            {sortedMembers.map((member, idx) => {
              const isMe = member.id === userId;
              const [g1, g2] = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
              return (
                <div key={member.id} className={cn(
                  "flex items-center p-4 gap-3.5 transition-colors border-b border-border last:border-none",
                  isMe && "bg-[#C9A84C]/5"
                )}>
                  <div className={cn(
                    "w-10 font-black italic",
                    idx === 0 ? "text-[#C9A84C] text-lg" : 
                    idx === 1 ? "text-slate-400 text-lg" :
                    idx === 2 ? "text-amber-700 text-lg" : "text-foreground/20 text-sm"
                  )}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </div>
                  <div 
                    className="w-9 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-black border border-white/20"
                    style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                  >
                    {member.nickname[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-sm font-bold", isMe ? "text-foreground" : "text-foreground/80")}>
                      {member.nickname}
                    </span>
                  </div>
                  <div className={cn("text-sm font-black tabular-nums", isMe ? "text-[#C9A84C]" : "text-foreground/40")}>
                    {member.weeklyMinutes.toLocaleString()}분
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="px-5 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-5 mb-6 text-center">
            <div className="text-[12px] font-black text-indigo-500 dark:text-indigo-300 uppercase tracking-widest mb-1">나의 이번주 기여</div>
            <div className="text-3xl font-black text-foreground tabular-nums mb-1">{userWeeklyMinutes.toLocaleString()}<span className="text-sm ml-1 opacity-50">분</span></div>
            <div className="text-foreground/30 text-[11px] font-bold">학습 시간이 많을수록 더 많은 보상을 받아요</div>
          </div>

          <div className="flex flex-col gap-3">
            {WEEKLY_REWARDS.map((reward) => {
              const isUnlocked = userWeeklyMinutes >= reward.target;
              const isClaimed = claimedRewards.has(reward.id);
              
              return (
                <div 
                  key={reward.id}
                  className={cn(
                    "rounded-2xl p-4 border flex items-center gap-4 transition-all duration-300",
                    isClaimed ? "bg-foreground/[0.02] border-border opacity-60" :
                    isUnlocked ? "bg-[#C9A84C]/10 border-[#C9A84C]/30 shadow-lg shadow-[#C9A84C]/5" :
                    "bg-card border-border"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border",
                    isUnlocked ? "bg-[#C9A84C]/20 border-[#C9A84C]/20" : "bg-foreground/5 border-border grayscale"
                  )}>
                    {reward.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-bold", isUnlocked ? "text-foreground" : "text-foreground/40")}>{reward.label}</div>
                    <div className={cn("text-[11px] font-medium mt-0.5", isUnlocked ? "text-[#C9A84C]" : "text-foreground/20")}>
                      {reward.rewardText}
                    </div>
                  </div>
                  <div>
                    {isClaimed ? (
                      <span className="text-foreground/20 text-xs font-black uppercase tracking-widest">수령 완료</span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => onClaimReward(reward.id)}
                        className="bg-[#C9A84C] text-background border-none rounded-lg px-4 py-2 text-xs font-black cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#C9A84C]/20"
                      >
                        받기
                      </button>
                    ) : (
                      <div className="text-foreground/20 text-[10px] font-black text-right">
                        {reward.target - userWeeklyMinutes}분 남음
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuildDetail;
