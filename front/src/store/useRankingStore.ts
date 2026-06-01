import { create } from 'zustand';
import { fetchCategoryRankings, RankingItem } from '@/lib/api';

interface RankingState {
  rankingsByCategory: Record<string, RankingItem[]>;
  isLoading: boolean;
  loadRankings: (category: string) => Promise<void>;
}

export const useRankingStore = create<RankingState>((set, get) => ({
  rankingsByCategory: {},
  isLoading: false,
  loadRankings: async (category: string) => {
    // 이미 불러온 이력이 있다면 즉시 리턴하여 네트워크 낭비 방지
    if (get().rankingsByCategory[category]) return;
    
    set({ isLoading: true });
    try {
      const data = await fetchCategoryRankings(category);
      set((state) => ({
        rankingsByCategory: { ...state.rankingsByCategory, [category]: data },
        isLoading: false,
      }));
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },
}));