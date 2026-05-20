import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Stats } from '@/types';

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

const MOCK_PARTIES: Party[] = [
  { id: 'p1', name: '새벽 4시 스터디', description: '매일 새벽 같이 공부해요', memberCount: 4, maxMembers: 6, weeklyMinutes: 1240, tags: ['수학', '과학'], isJoined: false },
  { id: 'p2', name: '코딩 마스터즈', description: '개발 공부하는 사람들 모여요', memberCount: 6, maxMembers: 6, weeklyMinutes: 2100, tags: ['프로그래밍'], isJoined: false },
  { id: 'p3', name: '영어 정복단', description: '토익 900 목표!', memberCount: 3, maxMembers: 5, weeklyMinutes: 890, tags: ['영어'], isJoined: false },
  { id: 'p4', name: '수능 완전정복', description: '수능 준비 같이해요', memberCount: 5, maxMembers: 6, weeklyMinutes: 1680, tags: ['수학', '국어', '영어'], isJoined: false },
  { id: 'p5', name: '취미 학습단', description: '무엇이든 배우는 모임', memberCount: 2, maxMembers: 8, weeklyMinutes: 430, tags: ['기타'], isJoined: false },
];

const MOCK_GUILDS: Guild[] = [
  { id: 'g1', name: '공부의 신전', description: '최고를 향해 달려가는 길드', memberCount: 18, maxMembers: 30, weeklyMinutes: 12400, level: 8, isJoined: false },
  { id: 'g2', name: '새벽별 학당', description: '꾸준함이 실력이다', memberCount: 12, maxMembers: 20, weeklyMinutes: 7200, level: 5, isJoined: false },
  { id: 'g3', name: '지식탐험대', description: '모든 분야를 탐구합니다', memberCount: 25, maxMembers: 30, weeklyMinutes: 9800, level: 7, isJoined: false },
  { id: 'g4', name: '입문자의 전당', description: '처음 시작하는 분 환영해요', memberCount: 8, maxMembers: 30, weeklyMinutes: 3100, level: 2, isJoined: false },
];

export interface AttendanceReward {
  gold: number;
  gems: number;
}

interface UserState {
  user: User;
  ownedCharacterIds: string[];
  parties: Party[];
  currentPartyId: string | null;
  guilds: Guild[];
  currentGuildId: string | null;
  lastAttendanceDate: string | null;  // 'YYYY-MM-DD'
  updateStats: (stats: Partial<Stats>) => void;
  updateProfileImage: (imageUrl: string | null) => void;
  addStats: (delta: Partial<Stats>) => void;
  updateCurrency: (gold?: number, gems?: number) => void;
  updateNickname: (nickname: string) => void;
  addCharacter: (id: string) => void;
  joinParty: (id: string) => void;
  leaveParty: () => void;
  createParty: (p: Omit<Party, 'id' | 'isJoined'>) => void;
  joinGuild: (id: string) => void;
  leaveGuild: () => void;
  createGuild: (g: Omit<Guild, 'id' | 'isJoined'>) => void;
  claimAttendance: () => AttendanceReward;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
  ownedCharacterIds: [],
  parties: MOCK_PARTIES,
  currentPartyId: null,
  guilds: MOCK_GUILDS,
  currentGuildId: null,
  lastAttendanceDate: null,
  user: {
    id: 'user-001',
    nickname: '탐험가',
    profileImage: null,
    stats: { INT: 50, STR: 0, END: 10, AGI: 0, CHA: 0, COP: 0 },
    gold: 1200,
    gems: 30,
    level: 7,
    exp: 340,
  },
  updateProfileImage: (imageUrl) =>
    set((state) => ({ user: { ...state.user, profileImage: imageUrl } })),
  updateStats: (stats) =>
    set((state) => ({
      user: { ...state.user, stats: { ...state.user.stats, ...stats } },
    })),
  addStats: (delta) =>
    set((state) => {
      const cur = state.user.stats;
      return {
        user: {
          ...state.user,
          stats: {
            INT: cur.INT + (delta.INT ?? 0),
            STR: cur.STR + (delta.STR ?? 0),
            END: cur.END + (delta.END ?? 0),
            AGI: cur.AGI + (delta.AGI ?? 0),
            CHA: cur.CHA + (delta.CHA ?? 0),
            COP: (cur.COP ?? 0) + (delta.COP ?? 0),
          },
        },
      };
    }),
  updateCurrency: (gold, gems) =>
    set((state) => ({
      user: {
        ...state.user,
        gold: gold !== undefined ? gold : state.user.gold,
        gems: gems !== undefined ? gems : state.user.gems,
      },
    })),
  updateNickname: (nickname) =>
    set((state) => ({ user: { ...state.user, nickname } })),
  addCharacter: (id) =>
    set((state) => ({
      ownedCharacterIds: state.ownedCharacterIds.includes(id)
        ? state.ownedCharacterIds
        : [...state.ownedCharacterIds, id],
    })),
  joinParty: (id) =>
    set((state) => ({
      currentPartyId: id,
      parties: state.parties.map((p) =>
        p.id === id ? { ...p, isJoined: true, memberCount: p.memberCount + 1 } : p
      ),
    })),
  leaveParty: () =>
    set((state) => ({
      currentPartyId: null,
      parties: state.parties.map((p) =>
        p.id === state.currentPartyId
          ? { ...p, isJoined: false, memberCount: Math.max(0, p.memberCount - 1) }
          : p
      ),
    })),
  createParty: (p) =>
    set((state) => {
      const newParty: Party = {
        ...p,
        id: `p${Date.now()}`,
        isJoined: true,
        memberCount: 1,
      };
      return {
        parties: [...state.parties, newParty],
        currentPartyId: newParty.id,
      };
    }),
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
        g.id === state.currentGuildId
          ? { ...g, isJoined: false, memberCount: Math.max(0, g.memberCount - 1) }
          : g
      ),
    })),
  createGuild: (g) =>
    set((state) => {
      const newGuild: Guild = {
        ...g,
        id: `g${Date.now()}`,
        isJoined: true,
        memberCount: 1,
      };
      return {
        guilds: [...state.guilds, newGuild],
        currentGuildId: newGuild.id,
      };
    }),
  claimAttendance: () => {
    const reward: AttendanceReward = { gold: 100, gems: 1 };
    const today = new Date().toISOString().slice(0, 10);
    set((state) => ({
      lastAttendanceDate: today,
      user: {
        ...state.user,
        gold: state.user.gold + reward.gold,
        gems: state.user.gems + reward.gems,
      },
    }));
    return reward;
  },
    }),
    {
      name: 'user-store',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as UserState;
        if (version < 2 && state?.user?.stats) {
          if (state.user.stats.COP === undefined) state.user.stats.COP = 0;
        }
        return state;
      },
    }
  )
);
