import { useState, useEffect } from 'react';
import { useQuizStore, OFFICIAL_UPVOTE_THRESHOLD } from '@/store/useQuizStore';
import type { UserQuiz } from '@/types';

const SUBJECT_COLORS: Record<string, string> = {
  수학: '#4ADE80',
  영어: '#60A5FA',
  과학: '#A78BFA',
  국어: '#F59E0B',
  사회: '#F472B6',
  프로그래밍: '#34D399',
  기타: '#94A3B8',
};

function Toast({ msg }: { msg: string }) {
  return (
    <div
      style={{
        position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(15,15,26,0.96)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14, padding: '11px 22px', color: '#fff', fontSize: 14,
        zIndex: 400, whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        animation: 'toastIn 200ms ease',
      }}
    >
      {msg}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

interface QuizListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuizListModal: React.FC<QuizListModalProps> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const {
    userQuizzes,
    deleteQuiz,
    voteQuiz,
    reportQuiz,
    upvotes,
    downvotes,
    userVotes,
    reportCounts,
    reportedByMe,
    officialIds,
  } = useQuizStore();

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 16);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const handleDelete = (quiz: UserQuiz) => {
    deleteQuiz(quiz.id);
    showToast('퀴즈가 삭제됐어요');
  };

  const handleVote = (quiz: UserQuiz, type: 'up' | 'down') => {
    const prevVote = userVotes[quiz.id];
    voteQuiz(quiz.id, type);
    if (prevVote === type) return;

    const upCount = (upvotes[quiz.id] ?? 0) + (type === 'up' ? 1 : 0);
    if (type === 'up' && upCount >= OFFICIAL_UPVOTE_THRESHOLD && !officialIds.includes(quiz.id)) {
      showToast('공식 문제로 편입됐어요!');
    } else {
      showToast(type === 'up' ? '좋아요를 눌렀어요' : '싫어요를 눌렀어요');
    }
  };

  const handleReport = (quiz: UserQuiz) => {
    if (reportedByMe.includes(quiz.id)) {
      showToast('이미 신고한 퀴즈예요');
      return;
    }
    reportQuiz(quiz.id);
    const newCount = (reportCounts[quiz.id] ?? 0) + 1;
    if (newCount >= 3) {
      showToast('신고가 접수됐어요. 문제가 숨겨졌어요');
    } else {
      showToast('신고가 접수됐어요');
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          backgroundColor: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
          transition: 'background-color 300ms ease',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 430, backgroundColor: '#1A1A2E',
            borderRadius: '24px 24px 0 0',
            padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
            transform: visible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 300ms ease',
            maxHeight: '80dvh', overflowY: 'auto', boxSizing: 'border-box',
          }}
        >
          {/* Drag handle */}
          <div
            style={{
              width: 40, height: 4, background: 'rgba(255,255,255,0.15)',
              borderRadius: 2, margin: '0 auto 20px',
            }}
          />

          {/* Header */}
          <div
            style={{
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between', marginBottom: 20,
            }}
          >
            <div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>내 퀴즈</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 }}>
                총 {userQuizzes.length}개
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          {userQuizzes.length === 0 ? (
            /* Empty state */
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>아직 만든 퀴즈가 없어요</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 6 }}>
                퀴즈를 만들면 학습할 때 출제돼요
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {userQuizzes.map((quiz) => {
                const color = SUBJECT_COLORS[quiz.subject] ?? '#94A3B8';
                const isHidden = (reportCounts[quiz.id] ?? 0) >= 3;
                const isOfficial = officialIds.includes(quiz.id);
                const myVote = userVotes[quiz.id];
                const upCount = upvotes[quiz.id] ?? 0;
                const downCount = downvotes[quiz.id] ?? 0;
                const hasReported = reportedByMe.includes(quiz.id);

                if (isHidden) {
                  return (
                    <div
                      key={quiz.id}
                      style={{
                        background: 'rgba(239,68,68,0.05)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        borderRadius: 14, padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>🚫</span>
                      <div>
                        <div style={{ color: 'rgba(239,68,68,0.7)', fontSize: 13, fontWeight: 600 }}>신고로 인해 숨겨진 퀴즈</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>관리자 검토 중이에요</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={quiz.id}
                    style={{
                      background: '#0F0F1A', borderRadius: 14,
                      border: isOfficial ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(255,255,255,0.08)',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              background: `${color}1A`, color,
                              borderRadius: 20, padding: '2px 10px',
                              fontSize: 11, fontWeight: 600,
                            }}
                          >
                            {quiz.subject}
                          </span>
                          <span
                            style={{
                              background: quiz.type === 'multiple'
                                ? 'rgba(96,165,250,0.12)' : 'rgba(167,139,250,0.12)',
                              color: quiz.type === 'multiple' ? '#60A5FA' : '#A78BFA',
                              borderRadius: 20, padding: '2px 10px',
                              fontSize: 11, fontWeight: 600,
                            }}
                          >
                            {quiz.type === 'multiple' ? '객관식' : '주관식'}
                          </span>
                          {isOfficial && (
                            <span style={{
                              background: 'rgba(201,168,76,0.15)', color: '#C9A84C',
                              borderRadius: 20, padding: '2px 10px',
                              fontSize: 11, fontWeight: 700,
                            }}>
                              공식
                            </span>
                          )}
                          {!isOfficial && upCount >= 3 && (
                            <span style={{
                              background: 'rgba(74,222,128,0.1)', color: '#4ADE80',
                              borderRadius: 20, padding: '2px 10px',
                              fontSize: 11, fontWeight: 600,
                            }}>
                              인기
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            color: '#fff', fontSize: 14, lineHeight: 1.4,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {quiz.question}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(quiz)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          border: 'none', background: 'rgba(239,68,68,0.1)',
                          color: '#EF4444', cursor: 'pointer', fontSize: 15,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Vote + Report row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      marginTop: 10, paddingTop: 10,
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {/* Upvote */}
                      <button
                        onClick={() => handleVote(quiz, 'up')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: myVote === 'up' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                          border: myVote === 'up' ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 20, padding: '4px 10px', cursor: 'pointer',
                          color: myVote === 'up' ? '#4ADE80' : 'rgba(255,255,255,0.4)',
                          fontSize: 12, fontWeight: myVote === 'up' ? 700 : 400,
                        }}
                      >
                        👍 {upCount}
                      </button>

                      {/* Downvote */}
                      <button
                        onClick={() => handleVote(quiz, 'down')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: myVote === 'down' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                          border: myVote === 'down' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 20, padding: '4px 10px', cursor: 'pointer',
                          color: myVote === 'down' ? '#EF4444' : 'rgba(255,255,255,0.4)',
                          fontSize: 12,
                        }}
                      >
                        👎 {downCount}
                      </button>

                      <div style={{ flex: 1 }} />

                      {/* Report */}
                      <button
                        onClick={() => handleReport(quiz)}
                        style={{
                          background: hasReported ? 'rgba(239,68,68,0.08)' : 'transparent',
                          border: 'none', cursor: hasReported ? 'default' : 'pointer',
                          color: hasReported ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.25)',
                          fontSize: 11, padding: '4px 6px', borderRadius: 6,
                        }}
                      >
                        {hasReported ? '신고됨' : '🚩 신고'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {toastMsg && <Toast msg={toastMsg} />}
    </>
  );
};

export default QuizListModal;
