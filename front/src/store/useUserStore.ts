import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Stats, AIStats } from '@/types';
import { calcExpMultiplier, calcExpGain, calcEvolutionStage, calcLevel, getDisplayCharacterId } from '@/lib/characterLevel';
import { ALL_CHARACTERS } from '@/constants/characters';
import { syncUserToServer, encodeBitmask } from '@/lib/api';
import { CharacterService } from '@/services/characterService';

export interface AttendanceReward {
  gold: number;
  gems: number;
}

export interface Potion {
  type: 'small' | 'large';
  multiplier: 1.5 | 2.0;
}

export interface ExpGainResult {
  expGained: number;
  didEvolve: boolean;
  evolutionStage: 0 | 1 | 2;
  toast: string | null;
}

interface UserState {
  user: User;
  ownedCharacterIds: string[];
  equippedCharacterId: string | null;
  characterExpMap: Record<string, number>;
  potionQueue: Potion[];
  lastAttendanceDate: string | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  login: () => void;
  logout: () => void;
  toggleTheme: () => void;
  updateStats: (stats: Partial<Stats>) => void;
  updateAIStats: (stats: Partial<AIStats>) => void;
  updateProfileImage: (imageUrl: string | null) => void;
  addStats: (delta: Partial<Stats>) => void;
  addExp: (amount: number) => void;
  addAIStats: (delta: Partial<AIStats>) => void;
  updateCurrency: (gold?: number, gems?: number) => void;
  updateNickname: (nickname: string) => void;
  addCharacter: (id: string) => void;
  claimAttendance: () => AttendanceReward;
  dataCollectionConsent: boolean | null;
  setConsent: (consent: boolean) => void;
  equipCharacter: (id: string) => void;
  gainEquippedCharacterExp: (durationMin: number, subjectMatch: boolean, quizRatio: number) => ExpGainResult;
  buyPotion: (type: 'small' | 'large') => boolean;
  gainExpFromStudy: (seconds: number) => Promise<{ evolved: boolean; toast: string | null }>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ownedCharacterIds: ['char_1', 'char_2', 'char_3'],
      equippedCharacterId: 'char_1',
      characterExpMap: {},
      potionQueue: [],
      lastAttendanceDate: null,
      dataCollectionConsent: null,
      isAuthenticated: false,
      theme: 'dark',
      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      user: {
        id: 'user-001',
        nickname: '탐험가',
        profileImage: null,
        stats: { HUM: 50, SOC: 0, NAT: 10, COL: 0, PER: 0, ART: 0 },
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

      equipCharacter: (id) => {
        set({ equippedCharacterId: id });
        const { ownedCharacterIds, characterExpMap } = get();
        syncUserToServer({
          equipped_character_id: id,
          owned_characters_bits: encodeBitmask(ownedCharacterIds),
          character_exp_map: characterExpMap,
        });
      },

      gainEquippedCharacterExp: (durationMin, subjectMatch, quizRatio) => {
        if (durationMin <= 0) return { expGained: 0, didEvolve: false, evolutionStage: 0, toast: null };
        const state = get();
        const equippedId = state.equippedCharacterId;
        if (!equippedId) return { expGained: 0, didEvolve: false, evolutionStage: 0, toast: null };

        const potion = state.potionQueue[0] ?? null;
        const potionMultiplier = potion ? potion.multiplier : 1.0;
        const newQueue = potion ? state.potionQueue.slice(1) : state.potionQueue;

        const multiplier = calcExpMultiplier({ subjectMatch, quizCorrectRatio: quizRatio, potionMultiplier });
        const expGained = calcExpGain(durationMin, multiplier);

        const prevExp = state.characterExpMap[equippedId] ?? 0;
        const newExp = prevExp + expGained;

        const prevStage = calcEvolutionStage(calcLevel(prevExp));
        const newStage = calcEvolutionStage(calcLevel(newExp));
        const didEvolve = newStage > prevStage;

        const newMap = { ...state.characterExpMap, [equippedId]: newExp };
        set({ characterExpMap: newMap, potionQueue: newQueue });

        syncUserToServer({ character_exp_map: newMap });

        let toast: string | null = null;
        if (didEvolve) {
          const displayId = getDisplayCharacterId(equippedId, calcLevel(newExp));
          const evolved = ALL_CHARACTERS.find((c) => c.id === displayId);
          toast = evolved ? `✨ ${evolved.name}(으)로 진화했습니다!` : '✨ 캐릭터가 진화했습니다!';
        }

        return { expGained, didEvolve, evolutionStage: newStage, toast };
      },

      buyPotion: (type) => {
        const state = get();
        const cost = type === 'small' ? { gold: 200, gems: 0 } : { gold: 0, gems: 1 };
        if (state.user.gold < cost.gold || state.user.gems < cost.gems) return false;

        const potion: Potion = { type, multiplier: type === 'small' ? 1.5 : 2.0 };
        const newQueue = [...state.potionQueue, potion];
        const newUser = {
          ...state.user,
          gold: state.user.gold - cost.gold,
          gems: state.user.gems - cost.gems,
        };
        set({ user: newUser, potionQueue: newQueue });
        syncUserToServer({ gold: newUser.gold, gems: newUser.gems });
        return true;
      },

      gainExpFromStudy: async (seconds) => {
        const { equippedCharacterId, characterExpMap } = get();
        if (!equippedCharacterId) return { evolved: false, toast: null };

        const expAmount = CharacterService.calculateExpFromSeconds(seconds);
        if (expAmount === 0) return { evolved: false, toast: null };

        const result = await CharacterService.processExpGain(
          equippedCharacterId,
          expAmount,
          characterExpMap
        );

        set((state) => ({
          characterExpMap: result.updatedExpMap,
          ownedCharacterIds: result.evolved && result.newCharacterId
            ? Array.from(new Set([...state.ownedCharacterIds, result.newCharacterId]))
            : state.ownedCharacterIds,
          equippedCharacterId: result.evolved && result.newCharacterId && state.equippedCharacterId === equippedCharacterId
            ? result.newCharacterId
            : state.equippedCharacterId
        }));

        return { evolved: result.evolved, toast: result.toast };
      },
    }),
    {
      name: 'user-store',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<UserState> | undefined;
        if (state?.user && version < 1) {
          state.user = {
            ...state.user,
            stats: { HUM: 0, SOC: 0, NAT: 0, COL: 0, PER: 0, ART: 0 },
          };
        }
        if (version < 2) {
          if (!state) return state as UserState;
          if (!(state as any).theme) (state as any).theme = 'dark';
          if (!(state as any).potionQueue) (state as any).potionQueue = [];
          if (!state.characterExpMap) state.characterExpMap = {};
          if (state.equippedCharacterId === undefined) state.equippedCharacterId = 'char_1';
        }
        return state as UserState;
      },
    }
  )
);
