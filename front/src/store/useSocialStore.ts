import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface SocialState {
  parties: Party[];
  currentPartyId: string | null;
  guilds: Guild[];
  currentGuildId: string | null;
  joinParty: (id: string) => void;
  leaveParty: () => void;
  createParty: (p: Omit<Party, 'id' | 'isJoined'>) => void;
  joinGuild: (id: string) => void;
  leaveGuild: () => void;
  createGuild: (g: Omit<Guild, 'id' | 'isJoined'>) => void;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set) => ({
      parties: MOCK_PARTIES,
      currentPartyId: null,
      guilds: MOCK_GUILDS,
      currentGuildId: null,
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
            id: `p${crypto.randomUUID()}`,
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
    }),
    { name: 'social-store' }
  )
);
