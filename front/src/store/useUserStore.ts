import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Stats } from '@/types';
import { EVOLUTION_CHAIN, ALL_CHARACTERS } from '@/lib/gachaSystem';
import { updateCharacterExpOnServer } from '@/lib/api';

export interface AttendanceReward {
  gold: number;
  gems: number;
}

interface UserState {
  user: User;
  ownedCharacterIds: string[];
  equippedCharacterId: string | null;              // 🎴 현재 장착 중인 대표 캐릭터 고유 ID
  characterExpMap: Record<string, number>;         // 📊 캐릭터별 개별 EXP 누적 테이블 (Key: ID, Value: EXP)
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
  equipCharacter: (id: string) => void;            // 🎴 캐릭터 교체 함수
  gainEquippedCharacterExp: (amount: number) => Promise<{ evolved: boolean; toast: string | null }>; // 🚀 경험치 축적 & 진화 엔진
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ownedCharacterIds: ['char_1', 'char_2', 'char_3'], // 초기 더미 진화용 기본 캐릭터 지급
      equippedCharacterId: 'char_1',                    // 앱 구동 시 공부엉이 자동 장착
      characterExpMap: {},
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
      
      // 캐릭터 장착 변경 액션 처리
      equipCharacter: (id) => set({ equippedCharacterId: id }),

      // 경험치 가산 및 실시간 진화 판독 처리 액션 코드
      gainEquippedCharacterExp: async (amount) => {
        const { equippedCharacterId, characterExpMap, ownedCharacterIds } = get();
        if (!equippedCharacterId) return { evolved: false, toast: null };

        // 📡 백엔드 연동용 API 비동기 정산 요청 호출
        try {  
          await updateCharacterExpOnServer({ characterId: equippedCharacterId, expGained: amount });  
        } catch (error) {  
          console.error("Failed to sync character exp with server:", error);  
        } 

        const currentExp = (characterExpMap[equippedCharacterId] || 0) + amount;
        const nextEvolutionId = EVOLUTION_CHAIN[equippedCharacterId];

        // 🎯 경험치 커트라인 100점 돌파 및 진화체가 지정되어 있을 때
        if (currentExp >= 100 && nextEvolutionId && !ownedCharacterIds.includes(nextEvolutionId)) {
          const evolvedCharacter = ALL_CHARACTERS.find(c => c.id === nextEvolutionId);
          const leftoverExp = currentExp - 100;  
          const updatedExpMap = { ...characterExpMap, [equippedCharacterId]: 0, [nextEvolutionId]: leftoverExp };  
          const updatedOwnedIds = Array.from(new Set([...ownedCharacterIds, nextEvolutionId]));

          set({
            characterExpMap: updatedExpMap,
            ownedCharacterIds: updatedOwnedIds,
            equippedCharacterId: nextEvolutionId // 대표 착용 캐릭터 즉시 자동 교체 진화!
          });

          return {
            evolved: true,
            toast: `🧬 [진화 성공] 캐릭터 경험치가 임계치를 돌파하여 대진화를 이뤄냈습니다! 새로운 진화 형태인 [${evolvedCharacter?.name}]을(를) 확인하세요!`
          };
        } else {
          // 일반적인 경험치 단순 축적 스택
          set({
            characterExpMap: {
              ...characterExpMap,
              [equippedCharacterId]: Math.min(100, currentExp) // 맥시멈 100 제한선
            }
          });
          return { evolved: false, toast: `✨ 착용 중인 캐릭터가 보상 EXP +${amount}를 획득했습니다. (${Math.min(100, currentExp)}/100)` };
        }
      },
    }),
    {
      name: 'user-store',
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