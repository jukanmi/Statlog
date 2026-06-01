// TAGS: UI, Component, Daily, Quest, Progress, Extensible
import React from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DailyQuestProps {
  questId: string;
  title: string;
  description: string;
  currentProgress: number;
  targetProgress: number;
  reward: { gold: number; gems: number };
  isClaimed: boolean;
  onClaim: (questId: string, reward: { gold: number; gems: number }) => void;
  onEditTarget?: () => void;
}

const DailyQuestCard: React.FC<DailyQuestProps> = ({
  questId,
  title,
  description,
  currentProgress,
  targetProgress,
  reward,
  isClaimed,
  onClaim,
  onEditTarget,
}) => {
  const isCompleted = currentProgress >= targetProgress;
  const progressRatio = Math.min(currentProgress / targetProgress, 1);

  return (
    <div
      className={cn(
        "bg-card rounded-2xl p-4 w-full max-w-[400px] shadow-lg mb-6 relative overflow-hidden transition-all duration-300",
        isClaimed 
          ? "border border-border" 
          : isCompleted 
            ? "border border-[#C9A84C] shadow-[#C9A84C]/10 shadow-xl" 
            : "border border-transparent"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="m-0 text-foreground text-base font-bold flex items-center gap-1.5">
            {title}
            {onEditTarget && (
              <button
                onClick={onEditTarget}
                className="bg-none border-none cursor-pointer p-1 flex items-center text-foreground/40 hover:text-foreground/60 transition-colors"
              >
                <Pencil size={14} />
              </button>
            )}
          </h3>
          <p className="m-0 text-foreground/50 text-xs mt-1">{description}</p>
        </div>
        <div className="flex gap-2 text-xs font-semibold">
          {reward.gold > 0 && <span className="text-[#C9A84C]">+{reward.gold}G</span>}
          {reward.gems > 0 && <span className="text-[#A78BFA]">+{reward.gems}젬</span>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out",
              isClaimed ? "bg-[#4ADE80]" : "bg-[#A78BFA]"
            )}
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>
        <span className="text-xs text-foreground font-semibold min-w-[40px] text-right">
          {currentProgress} / {targetProgress}
        </span>
      </div>

      <button
        disabled={!isCompleted || isClaimed}
        onClick={() => onClaim(questId, reward)}
        className={cn(
          "mt-4 w-full py-2.5 rounded-lg border-none font-bold transition-all active:scale-[0.98]",
          isClaimed 
            ? "bg-foreground/10 text-foreground/40 cursor-not-allowed" 
            : isCompleted 
              ? "bg-[#C9A84C] text-background cursor-pointer hover:brightness-110 shadow-lg shadow-[#C9A84C]/20" 
              : "bg-foreground/5 text-foreground/40 cursor-not-allowed"
        )}
      >
        {isClaimed ? '보상 받기 완료' : isCompleted ? '보상 받기' : '진행 중'}
      </button>
    </div>
  );
};

export default DailyQuestCard;
