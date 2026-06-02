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

const MOCK_GUILDS: Guild[] = [
  { id: 'g1', name: '공부의 신전', description: '최고를 향해 달려가는 길드', memberCount: 18, maxMembers: 30, weeklyMinutes: 12400, level: 8, isJoined: false },
  { id: 'g2', name: '새벽별 학당', description: '꾸준함이 실력이다', memberCount: 12, maxMembers: 20, weeklyMinutes: 7200, level: 5, isJoined: false },
  { id: 'g3', name: '지식탐험대', description: '모든 분야를 탐구합니다', memberCount: 25, maxMembers: 30, weeklyMinutes: 9800, level: 7, isJoined: false },
  { id: 'g4', name: '입문자의 전당', description: '처음 시작하는 분 환영해요', memberCount: 8, maxMembers: 30, weeklyMinutes: 3100, level: 2, isJoined: false },
];

interface SocialState {
  parties: Party[];
  currentParty: Party | null;
  currentPartyId: string | null;
  guilds: Guild[];
  currentGuildId: string | null;
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

  joinGuild: (id: string) => void;
  leaveGuild: () => void;
  createGuild: (g: Omit<Guild, 'id' | 'isJoined' | 'memberCount'>) => void;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      parties: [],
      currentParty: null,
      currentPartyId: null,
      guilds: MOCK_GUILDS,
      currentGuildId: null,
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

      joinGuild: (id) =>
        set((state) => ({
          currentGuildId: id,
          guilds: state.guilds.map((g) =>
            g.id === id ? { ...g, isJoined: true, memberCount: g.memberCount + 1 } : g
          ),
        })),
      leaveGuild: () =>
        set((state) => ({
          currentGuildId: null,
          guilds: state.guilds.map((g) =>
            g.id === state.currentGuildId ? { ...g, isJoined: false, memberCount: Math.max(0, g.memberCount - 1) } : g
          ),
        })),
      createGuild: (g) =>
        set((state) => {
          const newGuild: Guild = { ...g, id: `g${Date.now()}`, isJoined: true, memberCount: 1 };
          return { guilds: [...state.guilds, newGuild], currentGuildId: newGuild.id };
        }),
    }),
    { 
      name: 'social-store', 
      partialize: (state) => ({ 
        parties: state.parties,
        currentPartyId: state.currentPartyId, 
        currentParty: state.currentParty, 
        guilds: state.guilds, 
        currentGuildId: state.currentGuildId
      } as any)
    }
  )
);