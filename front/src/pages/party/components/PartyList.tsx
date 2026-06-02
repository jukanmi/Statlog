import React from 'react';
import { Search, Plus, Users, Clock } from 'lucide-react';
import { Party } from '@/store/useSocialStore';
import { cn } from '@/lib/utils';

interface PartyListProps {
  parties: Party[];
  search: string;
  onSearchChange: (val: string) => void;
  onJoin: (id: string) => void;
  onCreateClick: () => void;
  onViewDetail: () => void;
  hasJoined: boolean;
}

const PartyList: React.FC<PartyListProps> = ({
  parties,
  search,
  onSearchChange,
  onJoin,
  onCreateClick,
  onViewDetail,
  hasJoined,
}) => {
  const filtered = parties.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
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
            placeholder="파티 검색 (이름, 태그)"
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

      {/* My Party Banner (if joined) */}
      {hasJoined && (
        <div 
          onClick={onViewDetail}
          className="bg-gradient-to-br from-[#7C3AED]/20 to-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-2xl p-4 mb-6 cursor-pointer hover:brightness-110 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A84C] flex items-center justify-center text-background">
              <Users size={20} />
            </div>
            <div>
              <div className="text-foreground text-sm font-black">내 파티 확인하기</div>
              <div className="text-foreground/40 text-[11px] font-bold mt-0.5">현재 활동 중인 파티가 있어요</div>
            </div>
          </div>
          <div className="text-[#C9A84C] text-sm font-black tracking-tighter">이동하기 →</div>
        </div>
      )}

      {/* Party Grid */}
      <div className="grid grid-cols-1 gap-3.5">
        {filtered.map((party) => (
          <div
            key={party.id}
            className="bg-card border border-border rounded-2xl p-5 hover:border-foreground/10 transition-colors shadow-sm"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-foreground text-base font-black truncate m-0">{party.name}</h3>
                <p className="text-foreground/40 text-[12px] font-medium mt-1 truncate m-0">{party.description}</p>
              </div>
              <div className="flex gap-1.5 ml-2">
                {party.tags.map(tag => (
                  <span key={tag} className="bg-foreground/5 text-foreground/40 px-2 py-0.5 rounded-md text-[10px] font-bold border border-border">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-foreground/50">
                <Users size={14} />
                <span className="text-[12px] font-bold tabular-nums">{party.memberCount}/{party.maxMembers}</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground/50">
                <Clock size={14} />
                <span className="text-[12px] font-bold tabular-nums">{party.weeklyMinutes}분/주</span>
              </div>
            </div>

            <button
              onClick={() => onJoin(party.id)}
              disabled={party.memberCount >= party.maxMembers}
              className={cn(
                "w-full h-10 rounded-xl text-[13px] font-black transition-all active:scale-[0.98]",
                party.memberCount >= party.maxMembers
                  ? "bg-foreground/5 text-foreground/20 cursor-not-allowed border border-border"
                  : "bg-foreground/5 border border-border/10 text-foreground hover:bg-foreground/10"
              )}
            >
              {party.memberCount >= party.maxMembers ? '가득 참' : '파티 참가'}
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <div className="text-4xl mb-3 opacity-20">🔍</div>
          <div className="text-foreground/20 text-sm font-bold">검색 결과가 없어요</div>
        </div>
      )}
    </div>
  );
};

export default PartyList;
