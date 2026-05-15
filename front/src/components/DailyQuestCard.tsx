// TAGS: UI, Component, Daily, Quest, Progress, Extensible
import React from 'react';
import { Pencil } from 'lucide-react';

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
      style={{
        backgroundColor: '#1C1C28',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        border: isClaimed ? '1px solid rgba(255,255,255,0.1)' : isCompleted ? '1px solid #C9A84C' : '1px solid transparent',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            {title}
            {onEditTarget && (
              <button
                onClick={onEditTarget}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                <Pencil size={14} />
              </button>
            )}
          </h3>
          <p style={{ margin: 0, color: '#A0A0AB', fontSize: 12, marginTop: 4 }}>{description}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 12, fontWeight: 600 }}>
          {reward.gold > 0 && <span style={{ color: '#C9A84C' }}>+{reward.gold}G</span>}
          {reward.gems > 0 && <span style={{ color: '#A78BFA' }}>+{reward.gems}젬</span>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              backgroundColor: isClaimed ? '#4ADE80' : '#A78BFA',
              width: `${progressRatio * 100}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 600, minWidth: 40, textAlign: 'right' }}>
          {currentProgress} / {targetProgress}
        </span>
      </div>

      <button
        disabled={!isCompleted || isClaimed}
        onClick={() => onClaim(questId, reward)}
        style={{
          marginTop: 16,
          width: '100%',
          padding: '10px 0',
          borderRadius: 8,
          border: 'none',
          backgroundColor: isClaimed ? 'rgba(255,255,255,0.1)' : isCompleted ? '#C9A84C' : 'rgba(255,255,255,0.05)',
          color: isClaimed ? '#A0A0AB' : isCompleted ? '#13131A' : '#A0A0AB',
          fontWeight: 700,
          cursor: (!isCompleted || isClaimed) ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {isClaimed ? '보상 받기 완료' : isCompleted ? '보상 받기' : '진행 중'}
      </button>
    </div>
  );
};

export default DailyQuestCard;
