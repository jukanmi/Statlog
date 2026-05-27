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
  updateAIStats: (stats: Partial<AIStats>) => void;
  updateProfileImage: (imageUrl: string | null) => void;
  addStats: (delta: Partial<Stats>) => void;
  addAIStats: (delta: Partial<AIStats>) => void;
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
        stats: { INT: 50, STR: 0, END: 10, AGI: 0, CHA: 0 },
        aiStats: { HUM: 0, SOC: 0, NAT: 0, COL: 0, PER: 0, ART: 0, EXP: 0 },
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
      updateAIStats: (stats) =>
        set((state) => ({
          user: { ...state.user, aiStats: { ...state.user.aiStats, ...stats } },
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
              },
            },
          };
        }),
      addAIStats: (delta) =>
        set((state) => {
          const cur = state.user.aiStats;
          return {
            user: {
              ...state.user,
              aiStats: {
                HUM: cur.HUM + (delta.HUM ?? 0),
                SOC: cur.SOC + (delta.SOC ?? 0),
                NAT: cur.NAT + (delta.NAT ?? 0),
                COL: cur.COL + (delta.COL ?? 0),
                PER: cur.PER + (delta.PER ?? 0),
                ART: cur.ART + (delta.ART ?? 0),
                EXP: cur.EXP + (delta.EXP ?? 0),
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
    { name: 'user-store' }
  )
);
