import { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import type { GuildMember } from '@/store/useUserStore';

const MAX_OPTIONS = [10, 15, 20, 25, 30];

const MOCK_GUILD_MEMBERS: GuildMember[] = [
  { id: 'user-001', nickname: '탐험가', weeklyMinutes: 340, totalMinutes: 12400, grade: 'guild_master' },
  { id: 'm2', nickname: '새벽별', weeklyMinutes: 280, totalMinutes: 8900, grade: 'officer' },
  { id: 'm3', nickname: '코딩왕', weeklyMinutes: 210, totalMinutes: 6700, grade: 'member' },
  { id: 'm4', nickname: '독서가', weeklyMinutes: 185, totalMinutes: 5200, grade: 'member' },
  { id: 'm5', nickname: '야간탐험가', weeklyMinutes: 160, totalMinutes: 4100, grade: 'member' },
];

const AVATAR_GRADIENTS = [
  ['#4C1D95', '#6D28D9'],
  ['#1E3A5F', '#2563EB'],
  ['#14532D', '#16A34A'],
  ['#7C2D12', '#EA580C'],
  ['#1E3A5F', '#0E7490'],
];

const GRADE_LABELS: Record<GuildMember['grade'], string> = {
  guild_master: '길드장',
  officer: '부길드장',
  member: '멤버',
};

type GuildTab = 'home' | 'ranking' | 'rewards';
type View = 'list' | 'detail';

const WEEKLY_REWARDS = [
  { id: 'r1', target: 100, label: '100분 달성', gold: 50, gems: 0, rewardText: '골드 50', icon: '🪙' },
  { id: 'r2', target: 200, label: '200분 달성', gold: 150, gems: 0, rewardText: '골드 150', icon: '💰' },
  { id: 'r3', target: 340, label: '340분 달성', gold: 0, gems: 5, rewardText: '젬 5', icon: '💎' },
  { id: 'r4', target: 600, label: '600분 달성', gold: 200, gems: 10, rewardText: '골드 200 + 젬 10', icon: '🏆' },
];

function Toast({ msg }: { msg: string }) {
  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(15,15,26,0.96)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 14, padding: '11px 22px', color: '#fff', fontSize: 14, zIndex: 300,
      whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'toastIn 200ms ease',
    }}>
      {msg}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

const GuildSubScreen: React.FC = () => {
  const { guilds, currentGuildId, user, joinGuild, leaveGuild, createGuild, updateCurrency } = useUserStore();
  const [view, setView] = useState<View>('list');
  const [showModal, setShowModal] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [guildTab, setGuildTab] = useState<GuildTab>('home');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [claimedRewards, setClaimedRewards] = useState<Set<string>>(new Set());

  // Create modal fields
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cMax, setCMax] = useState(20);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const currentGuild = currentGuildId ? guilds.find((g) => g.id === currentGuildId) : null;

  const handleJoin = (id: string) => {
    if (currentGuildId) { showToast('먼저 현재 길드에서 탈퇴하세요'); return; }
    joinGuild(id);
    setView('detail');
    showToast('길드에 가입했어요! 🏰');
  };

  const handleLeave = () => {
    leaveGuild();
    setConfirmLeave(false);
    setGuildTab('home');
    setView('list');
    showToast('길드를 탈퇴했어요');
  };

  const handleCreate = () => {
    if (!cName.trim()) return;
    createGuild({ name: cName.trim(), description: cDesc.trim(), maxMembers: cMax, weeklyMinutes: 0, level: 1 });
    setShowModal(false);
    setCName(''); setCDesc(''); setCMax(20);
    setView('detail');
    showToast('길드가 생성되었어요! 🏰');
  };

  const handleClaimReward = (rewardId: string) => {
    const reward = WEEKLY_REWARDS.find((r) => r.id === rewardId);
    if (!reward) return;
    const newGold = reward.gold > 0 ? user.gold + reward.gold : undefined;
    const newGems = reward.gems > 0 ? user.gems + reward.gems : undefined;
    updateCurrency(newGold, newGems);
    setClaimedRewards((prev) => new Set([...prev, rewardId]));
    showToast(`보상 수령! ${reward.rewardText} 획득 🎁`);
  };

  // ─── My Guild Detail Screen ────────────────────────────────────────────────
  if (view === 'detail' && currentGuild) {
    const userWeeklyMinutes = MOCK_GUILD_MEMBERS.find((m) => m.id === user.id)?.weeklyMinutes ?? 0;
    const sortedMembers = [...MOCK_GUILD_MEMBERS].sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);
    const guildTotalMinutes = currentGuild.weeklyMinutes * 6;

    return (
      <div style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setView('list')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 22, lineHeight: 1, padding: '0 12px 0 0' }}
          >
            ←
          </button>
          <span style={{ flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: 700, marginRight: 34 }}>
            {currentGuild.name}
          </span>
        </div>

        {/* Inner tab pills */}
        <div style={{ padding: '16px 20px 0', display: 'flex', gap: 8 }}>
          {(['home', 'ranking', 'rewards'] as GuildTab[]).map((tab) => {
            const labels = { home: '홈', ranking: '주간 랭킹', rewards: '보상' };
            const isActive = guildTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setGuildTab(tab)}
                style={{
                  borderRadius: 20, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  background: isActive ? '#C9A84C' : 'transparent',
                  color: isActive ? '#000' : 'rgba(255,255,255,0.5)',
                  transition: 'all 150ms ease',
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* ─── 홈 tab ── */}
        {guildTab === 'home' && (
          <div style={{ padding: '16px 20px 0' }}>
            {/* Hero card */}
            <div style={{
              background: 'linear-gradient(135deg, #1B1B3A, #2D1B69)',
              border: '1px solid rgba(124,58,237,0.4)',
              borderRadius: 20, padding: 20, marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>{currentGuild.name}</span>
                <span style={{
                  background: 'rgba(124,58,237,0.2)', color: '#A78BFA',
                  borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                }}>
                  Lv.{currentGuild.level}
                </span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>{currentGuild.description}</div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
                <div style={{ display: 'flex', textAlign: 'center' }}>
                  {[
                    { value: `${currentGuild.memberCount}/${currentGuild.maxMembers}명`, label: '멤버수' },
                    { value: `${currentGuild.weeklyMinutes.toLocaleString()}분`, label: '이번주 학습' },
                    { value: `${guildTotalMinutes.toLocaleString()}분`, label: '누적 학습' },
                  ].map((stat, i) => (
                    <div key={i} style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{stat.value}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Member list */}
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>멤버 목록</div>
            <div style={{
              background: '#1A1A2E', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
            }}>
              {sortedMembers.map((member, idx) => {
                const isMe = member.id === user.id;
                const [g1, g2] = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                return (
                  <div key={member.id}>
                    {idx > 0 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0 16px' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${g1}, ${g2})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 16, fontWeight: 700,
                      }}>
                        {member.nickname[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{member.nickname}</span>
                          {isMe && (
                            <span style={{
                              background: 'rgba(201,168,76,0.15)', color: '#C9A84C',
                              borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600,
                            }}>나</span>
                          )}
                          <span style={{
                            background: member.grade === 'guild_master' ? 'rgba(124,58,237,0.15)'
                              : member.grade === 'officer' ? 'rgba(14,116,144,0.15)' : 'rgba(255,255,255,0.06)',
                            color: member.grade === 'guild_master' ? '#A78BFA'
                              : member.grade === 'officer' ? '#22D3EE' : 'rgba(255,255,255,0.4)',
                            borderRadius: 20, padding: '1px 8px', fontSize: 10,
                          }}>
                            {GRADE_LABELS[member.grade]}
                          </span>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                          이번주 {member.weeklyMinutes}분
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leave button */}
            <div style={{ textAlign: 'center', paddingTop: 28 }}>
              <button
                onClick={() => setConfirmLeave(true)}
                style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.65)', cursor: 'pointer', fontSize: 13 }}
              >
                길드 탈퇴
              </button>
            </div>
          </div>
        )}

        {/* ─── 주간 랭킹 tab ── */}
        {guildTab === 'ranking' && (
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{
              background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, overflow: 'hidden',
            }}>
              {/* Header row */}
              <div style={{
                display: 'flex', alignItems: 'center', padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, width: 36 }}>순위</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, flex: 1 }}>멤버</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>이번주</span>
              </div>
              {sortedMembers.map((member, idx) => {
                const isMe = member.id === user.id;
                const [g1, g2] = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                return (
                  <div key={member.id} style={{
                    display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12,
                    background: isMe ? 'rgba(201,168,76,0.04)' : 'transparent',
                  }}>
                    <div style={{
                      width: 36, flexShrink: 0,
                      color: idx === 0 ? '#C9A84C' : idx === 1 ? '#94A3B8' : idx === 2 ? '#CD7C4A' : 'rgba(255,255,255,0.3)',
                      fontSize: idx < 3 ? 16 : 14, fontWeight: 700,
                    }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </div>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${g1}, ${g2})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 15, fontWeight: 700,
                    }}>
                      {member.nickname[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#fff', fontSize: 14, fontWeight: isMe ? 700 : 500 }}>{member.nickname}</span>
                        {isMe && (
                          <span style={{
                            background: 'rgba(201,168,76,0.15)', color: '#C9A84C',
                            borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 600,
                          }}>나</span>
                        )}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 }}>
                        누적 {member.totalMinutes.toLocaleString()}분
                      </div>
                    </div>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                      {member.weeklyMinutes}분
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: 14, background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.15)',
              borderRadius: 12, padding: '12px 16px',
            }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' }}>
                📅 매주 월요일 00:00에 랭킹이 초기화됩니다
              </div>
            </div>
          </div>
        )}

        {/* ─── 보상 tab ── */}
        {guildTab === 'rewards' && (
          <div style={{ padding: '16px 20px 0' }}>
            {/* My weekly progress summary */}
            <div style={{
              background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: '14px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>이번주 내 학습량</div>
                <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{userWeeklyMinutes}분</div>
              </div>
              <div style={{
                background: 'rgba(201,168,76,0.1)', borderRadius: 12,
                padding: '8px 14px', textAlign: 'center',
              }}>
                <div style={{ color: '#C9A84C', fontSize: 18, fontWeight: 700 }}>
                  {WEEKLY_REWARDS.filter((r) => userWeeklyMinutes >= r.target).length}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>달성 목표</div>
              </div>
            </div>

            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              주간 달성 보상
            </div>

            {WEEKLY_REWARDS.map((reward) => {
              const unlocked = userWeeklyMinutes >= reward.target;
              const claimed = claimedRewards.has(reward.id);
              return (
                <div key={reward.id} style={{
                  background: '#1A1A2E',
                  border: claimed ? '1px solid rgba(201,168,76,0.2)' : unlocked ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 14, padding: '14px 16px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 14,
                  opacity: !unlocked ? 0.5 : 1,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: claimed ? 'rgba(201,168,76,0.1)' : unlocked ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {claimed ? '✅' : reward.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{reward.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                      보상: {reward.rewardText}
                    </div>
                  </div>
                  {claimed ? (
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>수령 완료</span>
                  ) : unlocked ? (
                    <button
                      onClick={() => handleClaimReward(reward.id)}
                      style={{
                        background: '#C9A84C', border: 'none', borderRadius: 10,
                        padding: '8px 14px', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      받기
                    </button>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>잠김</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {confirmLeave && (
          <ConfirmModal
            text="정말 탈퇴하시겠어요?"
            sub="길드를 나가면 다시 가입해야 해요"
            onCancel={() => setConfirmLeave(false)}
            onConfirm={handleLeave}
          />
        )}

        {toastMsg && <Toast msg={toastMsg} />}
      </div>
    );
  }

  // ─── Guild List Screen ─────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 20px 100px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>길드 찾기</span>
        {!currentGuildId && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'transparent', border: '1px solid #C9A84C',
              borderRadius: 20, padding: '6px 14px', color: '#C9A84C', fontSize: 13, cursor: 'pointer',
            }}
          >
            + 길드 만들기
          </button>
        )}
      </div>

      {/* My guild banner */}
      {currentGuild && (
        <div
          onClick={() => setView('detail')}
          style={{
            background: 'linear-gradient(135deg, #1B1B3A, #2D1B69)',
            border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: 16, padding: '14px 16px', marginBottom: 16, cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>내 길드</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{currentGuild.name}</span>
                <span style={{
                  background: 'rgba(124,58,237,0.2)', color: '#A78BFA',
                  borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                }}>Lv.{currentGuild.level}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                {currentGuild.memberCount}/{currentGuild.maxMembers}명 · 주간 {currentGuild.weeklyMinutes.toLocaleString()}분
              </div>
            </div>
            <span style={{ color: '#A78BFA', fontSize: 18 }}>›</span>
          </div>
        </div>
      )}

      {/* Guild list */}
      {guilds.map((guild) => {
        const isMyGuild = guild.id === currentGuildId;
        return (
          <div key={guild.id} style={{
            background: '#1A1A2E', borderRadius: 16,
            border: isMyGuild ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.08)',
            padding: 16, marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{guild.name}</span>
              <span style={{
                background: 'rgba(124,58,237,0.2)', color: '#A78BFA',
                borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
              }}>
                Lv.{guild.level}
              </span>
            </div>

            <div style={{
              color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {guild.description}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                👥 {guild.memberCount}/{guild.maxMembers}명
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                📚 주간 {guild.weeklyMinutes.toLocaleString()}분
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              {isMyGuild ? (
                <button
                  onClick={() => setView('detail')}
                  style={{
                    height: 32, borderRadius: 16, border: 'none',
                    background: 'rgba(124,58,237,0.2)', color: '#A78BFA',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 14px',
                  }}
                >
                  길드 보기
                </button>
              ) : (
                <button
                  onClick={() => handleJoin(guild.id)}
                  disabled={!!currentGuildId}
                  style={{
                    width: 72, height: 32, borderRadius: 16, border: 'none',
                    background: currentGuildId ? 'rgba(255,255,255,0.06)' : '#C9A84C',
                    color: currentGuildId ? 'rgba(255,255,255,0.3)' : '#000',
                    fontSize: 13, fontWeight: 700,
                    cursor: currentGuildId ? 'not-allowed' : 'pointer',
                  }}
                >
                  가입하기
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Create Guild Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 100,
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div style={{
            background: '#1A1A2E', borderRadius: '24px 24px 0 0',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '20px 20px calc(env(safe-area-inset-bottom) + 24px)',
            width: '100%', maxHeight: '85dvh', overflowY: 'auto',
            boxSizing: 'border-box',
          }}>
            <div style={{
              width: 40, height: 4, background: 'rgba(255,255,255,0.15)',
              borderRadius: 2, margin: '0 auto 20px',
            }} />
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              새 길드 만들기
            </div>

            <ModalLabel text="길드 이름" required />
            <input
              value={cName}
              onChange={(e) => setCName(e.target.value.slice(0, 20))}
              placeholder="길드 이름을 입력하세요"
              style={inputStyle}
            />
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 16 }}>
              {cName.length}/20
            </div>

            <ModalLabel text="길드 소개" />
            <textarea
              value={cDesc}
              onChange={(e) => setCDesc(e.target.value)}
              placeholder="어떤 길드인지 소개해주세요"
              rows={2}
              style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit', marginBottom: 20 }}
            />

            <ModalLabel text="최대 인원" />
            <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
              {MAX_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCMax(n)}
                  style={{
                    minWidth: 48, height: 36, borderRadius: 8, cursor: 'pointer',
                    border: cMax === n ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    background: cMax === n ? '#C9A84C' : '#0F0F1A',
                    color: cMax === n ? '#000' : 'rgba(255,255,255,0.5)',
                    fontSize: 14, fontWeight: cMax === n ? 700 : 400,
                    padding: '0 8px',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreate}
              disabled={!cName.trim()}
              style={{
                width: '100%', height: 52, borderRadius: 14, border: 'none',
                background: cName.trim() ? '#C9A84C' : 'rgba(201,168,76,0.3)',
                color: cName.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                fontSize: 15, fontWeight: 700,
                cursor: cName.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              길드 생성하기
            </button>
          </div>
        </div>
      )}

      {toastMsg && <Toast msg={toastMsg} />}
    </div>
  );
};

// ─── Shared helpers ────────────────────────────────────────────────────────

function ModalLabel({ text, required, sub }: { text: string; required?: boolean; sub?: string }) {
  return (
    <div style={{
      color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
      marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center',
    }}>
      {text}
      {required && <span style={{ color: '#EF4444' }}>*</span>}
      {sub && <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>({sub})</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, padding: '12px 14px',
  color: '#fff', fontSize: 14, outline: 'none', display: 'block',
};

function ConfirmModal({ text, sub, onCancel, onConfirm }: {
  text: string; sub: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px',
    }}>
      <div style={{
        background: '#1A1A2E', borderRadius: 20, padding: 28,
        border: '1px solid rgba(255,255,255,0.08)', maxWidth: 320, width: '100%',
      }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>{text}</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>{sub}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, height: 48, borderRadius: 12, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14,
            }}
          >취소</button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, height: 48, borderRadius: 12, cursor: 'pointer',
              border: 'none',
              background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 14, fontWeight: 700,
            }}
          >탈퇴하기</button>
        </div>
      </div>
    </div>
  );
}

export default GuildSubScreen;
