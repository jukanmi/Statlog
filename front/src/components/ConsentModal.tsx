import React from 'react';
import { useUserStore } from '../store/useUserStore';
import { ShieldAlert, Check, X } from 'lucide-react';

const ConsentModal: React.FC = () => {
  const { dataCollectionConsent, setConsent } = useUserStore();

  // If consent is already given or denied, don't render the modal
  if (dataCollectionConsent !== null) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-lg rounded-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">앱 개선을 위한 데이터 수집 동의</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                더 나은 학습 경험을 제공하기 위해, 여러분의 학습 데이터를 익명으로 수집하고자 합니다.
              </p>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 text-sm space-y-3">
            <div>
              <span className="font-semibold block mb-1">수집하는 항목</span>
              <ul className="list-disc list-inside text-muted-foreground ml-1">
                <li>학습 과목</li>
                <li>학습 시간</li>
                <li>학습 완료 시각</li>
              </ul>
            </div>
            <div>
              <span className="font-semibold block mb-1">수집 목적</span>
              <p className="text-muted-foreground">앱 통계 분석 및 AI 기반 맞춤형 서비스 개선</p>
            </div>
            <div className="pt-2 border-t border-border mt-2 text-xs text-primary/80 font-medium">
              * 이름, 이메일 등 개인을 식별할 수 있는 정보는 절대 수집하지 않습니다.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setConsent(false)}
              className="flex items-center justify-center gap-2 py-3 rounded-lg font-medium border border-border text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
              동의 안 함
            </button>
            <button
              onClick={() => setConsent(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Check className="w-4 h-4" />
              동의하고 시작
            </button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-4">
            설정 메뉴에서 언제든지 동의 여부를 변경할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
