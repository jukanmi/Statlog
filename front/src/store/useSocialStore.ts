import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchMyParty, createPartyOnServer, joinPartyByInviteCode, leavePartyOnServer, createPartyInvite, syncUserToServer } from '@/lib/api';
import { useUserStore } from './useUserStore';

export interface Party {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  weeklyMinutes: number;
  tags: string[];
  isJoined: boolean;
}

export interface Guild {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  weeklyMinutes: number;
  level: number;
  isJoined: boolean;
}

export interface GuildMember {
  id: string;
  nickname: string;
  weeklyMinutes: number;
  totalMinutes: number;
  grade: 'guild_master' | 'officer' | 'member';
}

interface SocialState {
  parties: Party[];
  currentParty: Party | null;
  currentPartyId: string | null;
  guilds: Guild[];
  currentGuildId: string | null;
  currentGuildMembers: GuildMember[];
  pollingIntervalId: number | null;

  loadMyParty: () => Promise<void>;
  createParty: (partyInput: { name: string; description: string; maxMembers: number; weeklyMinutes: number; tags: string[] }) => Promise<void>;
  joinParty: (id: string) => Promise<void>;
  joinPartyByInvite: (inviteCode: string) => Promise<void>;
  leaveParty: () => Promise<void>;
  generateInviteLink: (partyId: string) => Promise<string>;
  startPollingPartyProgress: () => void;
  stopPollingPartyProgress: () => void;
  completePartyQuest: (questId: string, rewards: { gold: number; gems: number; colStat: number }) => Promise<void>;

  loadGuilds: () => Promise<void>;
  loadMyGuild: () => Promise<void>;
  joinGuild: (id: string) => Promise<void>;
  leaveGuild: () => Promise<void>;
  createGuild: (g: { name: string; description: string; maxMembers: number }) => Promise<void>;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      parties: [],
      currentParty: null,
      currentPartyId: null,
      guilds: [],
      currentGuildId: null,
      currentGuildMembers: [],
      pollingIntervalId: null,

      loadMyParty: async () => {
        try {
          const serverParty = await fetchMyParty();
          if (serverParty) {
            const mappedParty: Party = {
              id: serverParty.id,
              name: serverParty.name,
              description: '서버 동기화 파티 세션',
              memberCount: serverParty.member_count || 1,
              maxMembers: serverParty.max_member_count,
              weeklyMinutes: serverParty.weekly_minutes || 0,
              tags: ['서버인증'],
              isJoined: true
            };
            set({
              currentPartyId: serverParty.id,
              currentParty: mappedParty,
              parties: [mappedParty]
            });
            get().startPollingPartyProgress();
          } else {
            set({ currentPartyId: null, currentParty: null });
            get().stopPollingPartyProgress();
          }
        } catch {
          set({ currentPartyId: null, currentParty: null });
        }
      },

      createParty: async (partyInput) => {
        try {
          // 🛠️ 오브젝트 내부 필드를 꺼내어 API 유틸에 정확하게 전송하도록 교정 완료
          const serverParty = await createPartyOnServer(partyInput.name, partyInput.maxMembers);
          const newParty: Party = {
            id: serverParty.id,
            name: serverParty.name,
            description: partyInput.description || '실시간 개설 파티',
            memberCount: 1,
            maxMembers: serverParty.max_member_count,
            weeklyMinutes: 0,
            tags: partyInput.tags || [],
            isJoined: true
          };
          set({
            currentPartyId: serverParty.id,
            currentParty: newParty,
            parties: [newParty]
          });
          get().startPollingPartyProgress();
        } catch (e: any) { alert(e.message || '파티 생성 실패'); }
      },

      joinParty: async (id) => {
        try {
          const token = localStorage.getItem('access_token');
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
          const res = await fetch(`${API_BASE_URL}/api/v1/parties/${id}/join`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || '파티 가입 실패');
          }
          const serverParty = await res.json();
          const mappedParty: Party = {
            id: serverParty.id,
            name: serverParty.name,
            description: '가입 완료 파티',
            memberCount: serverParty.member_count || 1,
            maxMembers: serverParty.max_member_count,
            weeklyMinutes: serverParty.weekly_minutes || 0,
            tags: ['팀원'],
            isJoined: true
          };
          set({
            currentPartyId: serverParty.id,
            currentParty: mappedParty,
            parties: [mappedParty]
          });
          get().startPollingPartyProgress();
        } catch (e: any) { alert(e.message); throw e; }
      },

      joinPartyByInvite: async (inviteCode) => {
        try {
          const serverParty = await joinPartyByInviteCode(inviteCode);
          const mappedParty: Party = {
            id: serverParty.id,
            name: serverParty.name,
            description: '초대 합류 파티',
            memberCount: serverParty.member_count || 2,
            maxMembers: serverParty.max_member_count,
            weeklyMinutes: serverParty.weekly_minutes || 0,
            tags: ['팀원'],
            isJoined: true
          };
          set({
            currentPartyId: serverParty.id,
            currentParty: mappedParty,
            parties: [mappedParty]
          });
          get().startPollingPartyProgress();
        } catch (e: any) { throw e; }
      },

      leaveParty: async () => {
        const partyId = get().currentPartyId;
        if (!partyId) return;
        try {
          await leavePartyOnServer(partyId);
          get().stopPollingPartyProgress();
          set({ currentPartyId: null, currentParty: null, parties: [] });
        } catch (e: any) { alert(e.message); }
      },

      generateInviteLink: async (partyId: string) => {
        const invite = await createPartyInvite(partyId);
        const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        return `${appUrl}?invite_code=${invite.invite_code}`;
      },

      startPollingPartyProgress: () => {
        if (get().pollingIntervalId) return;
        const intervalId = window.setInterval(async () => {
          const partyId = get().currentPartyId;
          if (!partyId) { get().stopPollingPartyProgress(); return; }
          try {
            const serverParty = await fetchMyParty();
            if (serverParty) {
              set({
                currentParty: {
                  ...get().currentParty!,
                  memberCount: serverParty.member_count || get().currentParty!.memberCount,
                  weeklyMinutes: serverParty.weekly_minutes || get().currentParty!.weeklyMinutes,
                }
              });
            }
          } catch { console.warn('폴링 동기화 실패'); }
        }, 10000);
        set({ pollingIntervalId: intervalId });
      },

      stopPollingPartyProgress: () => {
        const id = get().pollingIntervalId;
        if (id) { clearInterval(id); set({ pollingIntervalId: null }); }
      },

      completePartyQuest: async (questId, rewards) => {
        try {
          const userStore = useUserStore.getState();
          const nextGold = userStore.user.gold + rewards.gold;
          const nextGems = userStore.user.gems + rewards.gems;

          userStore.updateCurrency(nextGold, nextGems);
          userStore.addStats({ COL: rewards.colStat });

          await syncUserToServer({
            gold: nextGold,
            gems: nextGems,
            stats: userStore.user.stats
          });
        } catch (e) { console.error('보상 지급 동기화 실패:', e); }
      },

      loadGuilds: async () => {
        try {
          const token = localStorage.getItem('access_token');
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
          const res = await fetch(`${API_BASE_URL}/api/v1/guilds`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return;
          const data = await res.json();
          const currentGuildId = get().currentGuildId;
          set({
            guilds: data.map((g: any) => ({
              id: g.id, name: g.name, description: g.description ?? '',
              memberCount: g.member_count, maxMembers: g.max_members,
              weeklyMinutes: g.weekly_minutes, level: g.level,
              isJoined: g.id === currentGuildId,
            })),
          });
        } catch (e) { console.error('길드 목록 로드 실패:', e); }
      },

      loadMyGuild: async () => {
        try {
          const token = localStorage.getItem('access_token');
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
          const res = await fetch(`${API_BASE_URL}/api/v1/guilds/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 404) { set({ currentGuildId: null, currentGuildMembers: [] }); return; }
          if (!res.ok) return;
          const g = await res.json();
          set({
            currentGuildId: g.id,
            currentGuildMembers: (g.members ?? []).map((m: any) => ({
              id: m.user_id, nickname: m.nickname, grade: m.grade,
              weeklyMinutes: m.weekly_minutes, totalMinutes: m.total_minutes,
            })),
            guilds: get().guilds.map((gld) =>
              gld.id === g.id
                ? { ...gld, memberCount: g.member_count, weeklyMinutes: g.weekly_minutes, isJoined: true }
                : gld
            ),
          });
        } catch (e) { console.error('내 길드 로드 실패:', e); }
      },

      joinGuild: async (id) => {
        try {
          const token = localStorage.getItem('access_token');
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
          const res = await fetch(`${API_BASE_URL}/api/v1/guilds/${id}/join`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) { const err = await res.json(); throw new Error(err.detail); }
          const g = await res.json();
          set({
            currentGuildId: g.id,
            currentGuildMembers: (g.members ?? []).map((m: any) => ({
              id: m.user_id, nickname: m.nickname, grade: m.grade,
              weeklyMinutes: m.weekly_minutes, totalMinutes: m.total_minutes,
            })),
            guilds: get().guilds.map((gld) =>
              gld.id === g.id ? { ...gld, memberCount: g.member_count, isJoined: true } : gld
            ),
          });
        } catch (e: any) { alert(e.message || '길드 가입 실패'); throw e; }
      },

      leaveGuild: async () => {
        const guildId = get().currentGuildId;
        if (!guildId) return;
        try {
          const token = localStorage.getItem('access_token');
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
          const res = await fetch(`${API_BASE_URL}/api/v1/guilds/${guildId}/members/me`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) { const err = await res.json(); throw new Error(err.detail); }
          set({
            currentGuildId: null,
            currentGuildMembers: [],
            guilds: get().guilds.map((g) =>
              g.id === guildId ? { ...g, isJoined: false, memberCount: Math.max(0, g.memberCount - 1) } : g
            ),
          });
        } catch (e: any) { alert(e.message || '길드 탈퇴 실패'); throw e; }
      },

      createGuild: async (input) => {
        try {
          const token = localStorage.getItem('access_token');
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
          const res = await fetch(`${API_BASE_URL}/api/v1/guilds`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: input.name, description: input.description, max_members: input.maxMembers }),
          });
          if (!res.ok) { const err = await res.json(); throw new Error(err.detail); }
          const g = await res.json();
          const newGuild: Guild = {
            id: g.id, name: g.name, description: g.description ?? '',
            memberCount: g.member_count, maxMembers: g.max_members,
            weeklyMinutes: g.weekly_minutes, level: g.level, isJoined: true,
          };
          set({
            currentGuildId: g.id,
            currentGuildMembers: (g.members ?? []).map((m: any) => ({
              id: m.user_id, nickname: m.nickname, grade: m.grade,
              weeklyMinutes: m.weekly_minutes, totalMinutes: m.total_minutes,
            })),
            guilds: [...get().guilds, newGuild],
          });
        } catch (e: any) { alert(e.message || '길드 생성 실패'); throw e; }
      },
    }),
    { 
      name: 'social-store', 
      partialize: (state) => ({ 
        parties: state.parties,
        currentPartyId: state.currentPartyId, 
        currentParty: state.currentParty, 
        guilds: state.guilds,
        currentGuildId: state.currentGuildId,
        currentGuildMembers: state.currentGuildMembers
      } as any)
    }
  )
);