import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Stats } from '@/types';

export interface AttendanceReward {
  gold: number;
  gems: number;
}

interface UserState {
  user: User;
  ownedCharacterIds: string[];
  lastAttendanceDate: string | null;  // 'YYYY-MM-DD'
  updateStats: (stats: Partial<Stats>) => void;
  updateProfileImage: (imageUrl: string | null) => void;
  addStats: (delta: Partial<Stats>) => void;
  addExp: (amount: number) => void;
  updateCurrency: (gold?: number, gems?: number) => void;
  updateNickname: (nickname: string) => void;
  addCharacter: (id: string) => void;
  claimAttendance: () => AttendanceReward;
  dataCollectionConsent: boolean | null;
  setConsent: (consent: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ownedCharacterIds: [],
      lastAttendanceDate: null,
      dataCollectionConsent: null,
      user: {
        id: 'user-001',
        nickname: '탐험가',
        profileImage: null,
        stats: { HUM: 50, SOC: 0, NAT: 10, COL: 0, PER: 0, ART: 0 },
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
          const next = { ...cur };
          (Object.keys(next) as (keyof Stats)[]).forEach((key) => {
            next[key] = cur[key] + (delta[key] ?? 0);
          });
          return { user: { ...state.user, stats: next } };
        }),
      addExp: (amount) =>
        set((state) => ({
          user: { ...state.user, exp: state.user.exp + amount },
        })),
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
      claimAttendance: () => {
        const reward: AttendanceReward = { gold: 100, gems: 1 };
        const today = new Date().toLocaleDateString('en-CA');
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
      setConsent: (consent) => set({ dataCollectionConsent: consent }),
    }),
    {
      name: 'user-store',
      // v1: 스탯 체계를 5스탯(INT/STR/END/AGI/CHA) → 6스탯(HUM/SOC/NAT/COL/PER/ART)으로 교체.
      // 옛 구조가 저장된 localStorage를 6스탯 구조로 마이그레이션한다.
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as { user?: User } | undefined;
        if (state?.user && version < 1) {
          state.user = {
            ...state.user,
            stats: { HUM: 0, SOC: 0, NAT: 0, COL: 0, PER: 0, ART: 0 },
          };
        }
        return state as UserState;
      },
    }
  )
);
