import { useEffect } from 'react';
import { useSocialStore } from '@/store/useSocialStore';

export function usePartyInviteHandler(showToast: (msg: string) => void) {
  const joinPartyByInvite = useSocialStore((state) => state.joinPartyByInvite);
  const joinParty = useSocialStore((state) => state.joinParty); // 👥 일반 ID 기반 가입 액션도 호출할 수 있게 주입

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // 🛠️ [보완] join과 invite_code 파라미터를 둘 다 읽어올 수 있도록 수정합니다.
    const inviteCode = params.get('invite_code');
    const joinId = params.get('join');

    if (inviteCode || joinId) {
      // 대치 후 쿼리 스트링 청소하여 주소창 초기화
      window.history.replaceState({}, document.title, window.location.pathname);
      
      (async () => {
        try {
          if (inviteCode) {
            // 1. ?invite_code= 코드가 들어온 경우 (서버 초대장 가입)
            await joinPartyByInvite(inviteCode);
            showToast('🎉 초대 코드를 통해 공부 파티 가입에 성공했습니다!');
          } else if (joinId) {
            // 2. ?join= 파티 ID가 들어온 경우 (일반 리스트 기반 가입)
            await joinParty(joinId);
            showToast('🎉 해당 공부 파티 가입에 성공했습니다!');
          }
        } catch (error: any) {
          showToast(`❌ 파티 합류 실패: ${error.message || '유효하지 않은 코드입니다.'}`);
        }
      })();
    }
  }, [joinPartyByInvite, joinParty, showToast]);
}