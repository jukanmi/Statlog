import { EVOLUTION_CHAIN, ALL_CHARACTERS } from '@/constants/characters';
import { updateCharacterExpOnServer } from '@/lib/api';

export interface EvolutionResult {
  evolved: boolean;
  newCharacterId: string | null;
  updatedExpMap: Record<string, number>;
  toast: string | null;
}

export const CharacterService = {
  /**
   * 공부 시간에 따른 경험치 계산 로직 (순수 함수)
   */
  calculateExpFromSeconds(seconds: number): number {
    if (seconds < 60) return 0;
    // 180초당 1점, 최소 10, 최대 45
    return Math.max(10, Math.min(45, Math.round(seconds / 180)));
  },

  /**
   * 캐릭터 경험치 갱신 및 진화 판정 로직
   */
  async processExpGain(
    characterId: string,
    amount: number,
    currentExpMap: Record<string, number>
  ): Promise<EvolutionResult> {
    // 1. 서버 동기화
    try {
      await updateCharacterExpOnServer({ characterId, expGained: amount });
    } catch (error) {
      console.error("Failed to sync character exp with server:", error);
      // 실무에서는 여기서 에러를 던지거나 사용자에게 알림을 줄 수 있음
    }

    const currentExp = (currentExpMap[characterId] || 0) + amount;
    const nextEvolutionId = EVOLUTION_CHAIN[characterId];

    // 2. 진화 판정 (경험치 100 이상 & 진화형 존재)
    if (currentExp >= 100 && nextEvolutionId) {
      const evolvedCharacter = ALL_CHARACTERS.find(c => c.id === nextEvolutionId);
      const leftoverExp = currentExp - 100;
      
      const updatedExpMap = {
        ...currentExpMap,
        [characterId]: 0,
        [nextEvolutionId]: (currentExpMap[nextEvolutionId] || 0) + leftoverExp
      };

      return {
        evolved: true,
        newCharacterId: nextEvolutionId,
        updatedExpMap,
        toast: `🧬 [진화 성공] [${evolvedCharacter?.name}]으로 진화했습니다!`
      };
    }

    // 3. 일반 경험치 획득
    return {
      evolved: false,
      newCharacterId: null,
      updatedExpMap: {
        ...currentExpMap,
        [characterId]: Math.min(100, currentExp)
      },
      toast: `✨ 경험치 +${amount}를 획득했습니다. (${Math.min(100, currentExp)}/100)`
    };
  }
};
