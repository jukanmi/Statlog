import { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';

const PARTY_TAGS = ['수학', '영어', '과학', '국어', '사회', '프로그래밍', '기타'];
const MAX_OPTIONS = [2, 3, 4, 5, 6, 8];

const MOCK_MEMBERS = [
  { id: 'user-001', nickname: '탐험가', weeklyMinutes: 340 },
  { id: 'm2', nickname: '새벽별', weeklyMinutes: 280 },
  { id: 'm3', nickname: '코딩왕', weeklyMinutes: 210 },
  { id: 'm4', nickname: '독서가', weeklyMinutes: 185 },
];

const AVATAR_GRADIENTS = [
  ['#4C1D95', '#6D28D9'],
  ['#1E3A5F', '#2563EB'],
  ['#14532D', '#16A34A'],
  ['#7C2D12', '#EA580C'],
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

type View = 'list' | 'detail';

const PartySubScreen: React.FC = () => {
  const { parties, currentPartyId, user, joinParty, leaveParty, createParty } = useUserStore();
  const [view, setView] = useState<View>('list');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Create modal fields
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cMax, setCMax] = useState(4);
  const [cTags, setCTags] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const currentParty = currentPartyId ? parties.find((p) => p.id === currentPartyId) : null;

  const handleJoin = (id: string) => {
    if (currentPartyId) { showToast('먼저 현재 파티에서 탈퇴하세요'); return; }
    const p = parties.find((x) => x.id === id)!;
    if (p.memberCount >= p.maxMembers) { showToast('파티가 가득 찼어요'); return; }
    joinParty(id);
    setView('detail');
    showToast('파티에 가입했어요! 🎉');
  };

  const handleLeave = () => {
    leaveParty();
    setConfirmLeave(false);
    setView('list');
    showToast('파티를 탈퇴했어요');
  };

  const handleCreate = () => {
    if (!cName.trim()) return;
    createParty({ name: cName.trim(), description: cDesc.trim(), maxMembers: cMax, weeklyMinutes: 0, tags: cTags });
    setShowModal(false);
    setCName(''); setCDesc(''); setCMax(4); setCTags([]);
    setView('detail');
    showToast('파티가 생성되었어요! ⚔️');
  };

  const toggleTag = (tag: string) => {
    if (cTags.includes(tag)) setCTags(cTags.filter((t) => t !== tag));
    else if (cTags.length < 3) setCTags([...cTags, tag]);
  };

  // ─── My Party Detail Screen ───────────────────────────────────────────────
  if (view === 'detail' && currentParty) {
    const members = [...MOCK_MEMBERS].sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);

    return (
      <div style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            onClick={() => setView('list')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)', fontSize: 22, lineHeight: 1,
              padding: '0 12px 0 0', display: 'flex', alignItems: 'center',
            }}
          >
            ←
          </button>
          <span style={{
            flex: 1, textAlign: 'center', color: '#fff',
            fontSize: 18, fontWeight: 700, marginRight: 34,
          }}>
            {currentParty.name}
          </span>
        </div>

        {/* Hero card */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1A1A2E, #2D1B4E)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 20, padding: 20,
          }}>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{currentParty.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>{currentParty.description}</div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '16px 0' }} />
            <div style={{ display: 'flex', textAlign: 'center' }}>
              {[
                { value: `${currentParty.memberCount}/${currentParty.maxMembers}`, label: '멤버' },
                { value: `${currentParty.weeklyMinutes}분`, label: '이번주 학습' },
                { value: '#1', label: '파티 랭킹' },
              ].map((stat, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Member list */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>멤버 목록</div>
          <div style={{
            background: '#1A1A2E', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
          }}>
            {members.map((member, idx) => {
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{member.nickname}</span>
                        {isMe && (
                          <span style={{
                            background: 'rgba(201,168,76,0.15)', color: '#C9A84C',
                            borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600,
                          }}>나</span>
                        )}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                        이번주 {member.weeklyMinutes}분
                      </div>
                    </div>
                    <div style={{
                      color: idx === 0 ? '#C9A84C' : 'rgba(255,255,255,0.35)',
                      fontSize: 14, fontWeight: 700,
                    }}>
                      #{idx + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave button */}
        <div style={{ textAlign: 'center', paddingTop: 28 }}>
          <button
            onClick={() => setConfirmLeave(true)}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(239,68,68,0.65)', cursor: 'pointer', fontSize: 13,
            }}
          >
            파티 탈퇴
          </button>
        </div>

        {/* Confirm leave modal */}
        {confirmLeave && <ConfirmModal
          text="정말 탈퇴하시겠어요?"
          sub="파티를 나가면 다시 가입해야 해요"
          onCancel={() => setConfirmLeave(false)}
          onConfirm={handleLeave}
        />}

        {toastMsg && <Toast msg={toastMsg} />}
      </div>
    );
  }

  // ─── Party List Screen ────────────────────────────────────────────────────
  const filtered = parties.filter((p) => p.name.includes(search));

  return (
    <div style={{ padding: '20px 20px 100px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>파티 찾기</span>
        {!currentPartyId && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'transparent', border: '1px solid #C9A84C',
              borderRadius: 20, padding: '6px 14px', color: '#C9A84C',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            + 파티 만들기
          </button>
        )}
      </div>

      {/* My party banner */}
      {currentParty && (
        <div
          onClick={() => setView('detail')}
          style={{
            background: 'linear-gradient(135deg, #1A1A2E, #2D1B4E)',
            border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: 16, padding: '14px 16px', marginBottom: 16, cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>내 파티</div>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{currentParty.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                {currentParty.memberCount}/{currentParty.maxMembers}명 · 이번주 {currentParty.weeklyMinutes}분
              </div>
            </div>
            <span style={{ color: '#A78BFA', fontSize: 18 }}>›</span>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'rgba(255,255,255,0.3)', fontSize: 15, pointerEvents: 'none',
        }}>🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="파티 이름으로 검색..."
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '12px 16px 12px 42px',
            color: '#fff', fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {/* Party list */}
      {filtered.map((party) => {
        const isFull = party.memberCount >= party.maxMembers;
        const isMyParty = party.id === currentPartyId;
        return (
          <div key={party.id} style={{
            background: '#1A1A2E', borderRadius: 16,
            border: isMyParty ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.08)',
            padding: 16, marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{party.name}</span>
              <span style={{
                background: isFull ? 'rgba(239,68,68,0.15)' : 'rgba(74,222,128,0.1)',
                color: isFull ? '#EF4444' : '#4ADE80',
                borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
              }}>
                {party.memberCount}/{party.maxMembers}
              </span>
            </div>

            <div style={{
              color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {party.description}
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {party.tags.map((tag) => (
                <span key={tag} style={{
                  background: 'rgba(201,168,76,0.1)', color: '#C9A84C',
                  borderRadius: 20, padding: '3px 10px', fontSize: 11,
                }}>
                  {tag}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                📚 이번주 {party.weeklyMinutes}분 학습
              </span>
              {isMyParty ? (
                <button
                  onClick={() => setView('detail')}
                  style={{
                    height: 32, borderRadius: 16, border: 'none',
                    background: 'rgba(124,58,237,0.2)', color: '#A78BFA',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 14px',
                  }}
                >
                  파티 보기
                </button>
              ) : (
                <button
                  onClick={() => handleJoin(party.id)}
                  disabled={isFull || !!currentPartyId}
                  style={{
                    width: 72, height: 32, borderRadius: 16, border: 'none',
                    background: (isFull || currentPartyId) ? 'rgba(255,255,255,0.06)' : '#C9A84C',
                    color: (isFull || currentPartyId) ? 'rgba(255,255,255,0.3)' : '#000',
                    fontSize: 13, fontWeight: 700,
                    cursor: (isFull || currentPartyId) ? 'not-allowed' : 'pointer',
                  }}
                >
                  가입하기
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Create Party Modal */}
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
            width: '100%', maxHeight: '88dvh', overflowY: 'auto',
            boxSizing: 'border-box',
          }}>
            <div style={{
              width: 40, height: 4, background: 'rgba(255,255,255,0.15)',
              borderRadius: 2, margin: '0 auto 20px',
            }} />
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              새 파티 만들기
            </div>

            <ModalLabel text="파티 이름" required />
            <input
              value={cName}
              onChange={(e) => setCName(e.target.value.slice(0, 20))}
              placeholder="파티 이름을 입력하세요"
              style={inputStyle}
            />
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 16 }}>
              {cName.length}/20
            </div>

            <ModalLabel text="파티 소개" />
            <textarea
              value={cDesc}
              onChange={(e) => setCDesc(e.target.value)}
              placeholder="어떤 파티인지 소개해주세요"
              rows={2}
              style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit', marginBottom: 20 }}
            />

            <ModalLabel text="최대 인원" />
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {MAX_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCMax(n)}
                  style={{
                    width: 40, height: 36, borderRadius: 8, cursor: 'pointer',
                    border: cMax === n ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    background: cMax === n ? '#C9A84C' : '#0F0F1A',
                    color: cMax === n ? '#000' : 'rgba(255,255,255,0.5)',
                    fontSize: 14, fontWeight: cMax === n ? 700 : 400,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <ModalLabel text="공부 태그" sub="최대 3개" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
              {PARTY_TAGS.map((tag) => {
                const on = cTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                      borderRadius: 20, cursor: 'pointer',
                      border: on ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      background: on ? 'rgba(201,168,76,0.15)' : '#0F0F1A',
                      color: on ? '#C9A84C' : 'rgba(255,255,255,0.5)',
                      padding: '6px 14px', fontSize: 13,
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
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
              파티 생성하기
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
    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
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
  color: '#fff', fontSize: 14, outline: 'none',
  display: 'block',
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

export default PartySubScreen;
