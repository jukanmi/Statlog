import { useState } from 'react';
import { useStudyStore } from '@/store/useStudyStore';
import type { StudySession } from '@/types';
import { SUBJECT_ICONS } from '@/constants/characters';

function getLast35Days(): string[] {
  const today = new Date();
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (34 - i));
    return d.toLocaleDateString('sv-SE');
  });
}

function getDayColor(minutes: number): string {
  if (minutes === 0) return 'rgba(255,255,255,0.04)';
  if (minutes <= 30) return 'rgba(74,222,128,0.3)';
  if (minutes <= 60) return 'rgba(74,222,128,0.6)';
  return '#C9A84C';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

const StreakHeatmap: React.FC = () => {
  const sessions = useStudyStore((s) => s.sessions);
  const studyStreak = useStudyStore((s) => s.studyStreak);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = getLast35Days();

  const minutesByDate: Record<string, number> = {};
  for (const session of sessions) {
    minutesByDate[session.date] = (minutesByDate[session.date] ?? 0) + session.durationMinutes;
  }

  const selectedSessions: StudySession[] = selectedDate
    ? sessions.filter((s) => s.date === selectedDate)
    : [];

  const handleDayClick = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
  };

  return (
    <div style={{ background: '#1A1A2E', borderRadius: 16, padding: 20 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
      }}>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>공부 기록</span>
        {studyStreak > 0 && (
          <span style={{
            background: 'rgba(201,168,76,0.1)', color: '#C9A84C',
            borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
          }}>
            🔥 {studyStreak}일 연속
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {days.map((date) => {
          const minutes = minutesByDate[date] ?? 0;
          const isSelected = selectedDate === date;
          return (
            <button
              key={date}
              onClick={() => handleDayClick(date)}
              title={`${formatDate(date)}: ${minutes}분`}
              style={{
                aspectRatio: '1',
                borderRadius: 4,
                backgroundColor: isSelected ? '#C9A84C' : getDayColor(minutes),
                border: `2px solid ${isSelected ? '#E8CC7A' : 'transparent'}`,
                cursor: 'pointer',
                padding: 0,
                transition: 'background-color 150ms, border-color 150ms',
              }}
            />
          );
        })}
      </div>

      <div style={{
        display: 'flex', gap: 12, marginTop: 10, justifyContent: 'flex-end',
      }}>
        {[
          { label: '없음', color: 'rgba(255,255,255,0.04)' },
          { label: '~30분', color: 'rgba(74,222,128,0.3)' },
          { label: '~60분', color: 'rgba(74,222,128,0.6)' },
          { label: '60분+', color: '#C9A84C' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
          </div>
        ))}
      </div>

      {selectedDate && (
        <div style={{
          marginTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 14,
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, marginBottom: 10,
          }}>
            {formatDate(selectedDate)}
          </div>

          {selectedSessions.length === 0 ? (
            <div style={{
              color: 'rgba(255,255,255,0.3)', fontSize: 12,
              textAlign: 'center', padding: '8px 0',
            }}>
              이날은 공부 기록이 없어요
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedSessions.map((session) => (
                <div key={session.id} style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '10px 12px',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', marginBottom: 4,
                  }}>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                      {SUBJECT_ICONS[session.subject] ?? '⭐'} {session.subject}
                    </span>
                    <span style={{ color: '#C9A84C', fontSize: 12, fontWeight: 600 }}>
                      {session.durationMinutes}분
                    </span>
                  </div>
                  {session.content && (
                    <div style={{
                      color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 1.4,
                    }}>
                      {session.content.length > 40
                        ? `${session.content.slice(0, 40)}…`
                        : session.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StreakHeatmap;
