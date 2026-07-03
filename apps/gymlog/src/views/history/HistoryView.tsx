'use client';

import { sessionHistoryAtom } from '@entities/session/model/store';
import { isSameDay, useMounted } from '@shared/lib';
import { AppHeader } from '@widgets/app-header/ui';
import { HistoryStats, SessionLogCard, WorkoutCalendar } from '@widgets/workout-calendar/ui';
import { useAtom } from 'jotai';
import { useMemo, useState } from 'react';

export function HistoryView() {
  const [history] = useAtom(sessionHistoryAtom);
  const mounted = useMounted();
  // 기본은 전체 모드(null) — 들어오면 모든 운동 내역을 최근순으로 한눈에.
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const sessions = useMemo(() => {
    const recentFirst = [...history].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    return selectedDate
      ? recentFirst.filter((session) => isSameDay(new Date(session.startedAt), selectedDate))
      : recentFirst;
  }, [history, selectedDate]);

  // 달력의 같은 날을 다시 누르면 전체로 돌아온다.
  const handleSelectDate = (date: Date) => setSelectedDate((prev) => (prev && isSameDay(prev, date) ? null : date));

  return (
    <>
      <AppHeader title="기록" />
      <main className="mx-auto flex w-full max-w-mobile flex-col gap-lg px-lg pb-28 pt-lg">
        {!mounted ? (
          <p className="text-muted-foreground">불러오는 중…</p>
        ) : (
          <>
            <HistoryStats sessions={history} />
            <WorkoutCalendar sessions={history} selectedDate={selectedDate} onSelectDate={handleSelectDate} />

            <div className="flex flex-col gap-md">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedDate ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일` : '전체 기록'}
                </h2>
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    전체 보기
                  </button>
                )}
              </div>
              {sessions.length === 0 ? (
                <p className="rounded-lg border border-card-border bg-glass p-lg text-sm text-muted-foreground">
                  {selectedDate ? '이 날은 기록이 없어요.' : '아직 운동 기록이 없어요. 첫 운동을 시작해보세요.'}
                </p>
              ) : (
                sessions.map((session) => <SessionLogCard key={session.id} session={session} />)
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
