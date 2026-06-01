import React from 'react';
import { Search, Plus, Users, Shield, Trophy } from 'lucide-react';
import { Guild } from '@/store/useSocialStore';
import { cn } from '@/lib/utils';

interface GuildListProps {
  guilds: Guild[];
  search: string;
  onSearchChange: (val: string) => void;
  onJoin: (id: string) => void;
  onCreateClick: () => void;
  onViewDetail: () => void;
  hasJoined: boolean;
}

const GuildList: React.FC<GuildListProps> = ({
  guilds,
  search,
  onSearchChange,
  onJoin,
  onCreateClick,
  onViewDetail,
  hasJoined,
}) => {
  const filtered = guilds.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-5 pb-24 animate-in fade-in duration-300">
      {/* Search & Create */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/20" size={18} />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="길드 검색"
            className="w-full h-11 bg-foreground/5 border border-border rounded-xl pl-10 pr-4 text-sm text-foreground placeholder:text-foreground/20 outline-none focus:border-[#C9A84C]/50 transition-colors"
          />
        </div>
        <button
          onClick={onCreateClick}
          className="w-11 h-11 bg-[#C9A84C] rounded-xl flex items-center justify-center text-background hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#C9A84C]/20"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* My Guild Banner */}
      {hasJoined && (
        <div 
          onClick={onViewDetail}
          className="bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-purple-500/30 rounded-2xl p-4 mb-6 cursor-pointer hover:brightness-110 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
              <Shield size={20} />
            </div>
            <div>
              <div className="text-foreground text-sm font-black">내 길드 확인하기</div>
              <div className="text-foreground/40 text-[11px] font-bold mt-0.5">현재 소속된 길드가 있어요</div>
            </div>
          </div>
          <div className="text-indigo-400 text-sm font-black tracking-tighter">이동하기 →</div>
        </div>
      )}

      {/* Guild Grid */}
      <div className="grid grid-cols-1 gap-3.5">
        {filtered.map((guild) => (
          <div
            key={guild.id}
            className="bg-card border border-border rounded-2xl p-5 hover:border-foreground/10 transition-colors shadow-sm relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-foreground text-base font-black truncate m-0">{guild.name}</h3>
                  <span className="bg-foreground/5 text-foreground/40 px-2 py-0.5 rounded-md text-[10px] font-black border border-border">
                    LV.{guild.level}
                  </span>
                </div>
                <p className="text-foreground/40 text-[12px] font-medium truncate m-0">{guild.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-foreground/50">
                <Users size={14} className="text-indigo-400" />
                <span className="text-[12px] font-bold tabular-nums">{guild.memberCount}/{guild.maxMembers}명</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground/50">
                <Trophy size={14} className="text-yellow-500" />
                <span className="text-[12px] font-bold tabular-nums">{guild.weeklyMinutes.toLocaleString()}분/주</span>
              </div>
            </div>

            <button
              onClick={() => onJoin(guild.id)}
              disabled={guild.memberCount >= guild.maxMembers}
              className={cn(
                "w-full h-10 rounded-xl text-[13px] font-black transition-all active:scale-[0.98]",
                guild.memberCount >= guild.maxMembers
                  ? "bg-foreground/5 text-foreground/20 cursor-not-allowed border border-border"
                  : "bg-foreground/5 border border-border/10 text-foreground hover:bg-foreground/10"
              )}
            >
              {guild.memberCount >= guild.maxMembers ? '가득 참' : '가입 신청'}
            </button>
            
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-colors" />
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <div className="text-4xl mb-3 opacity-20">🏰</div>
          <div className="text-foreground/20 text-sm font-bold">검색 결과가 없어요</div>
        </div>
      )}
    </div>
  );
};

export default GuildList;
