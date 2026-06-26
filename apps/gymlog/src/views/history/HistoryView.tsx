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
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const daySessions = useMemo(
    () => history.filter((session) => isSameDay(new Date(session.startedAt), selectedDate)),
    [history, selectedDate],
  );

  return (
    <>
      <AppHeader title="기록" />
      <main className="mx-auto flex w-full max-w-content flex-col gap-lg px-lg pb-3xl pt-lg">
        {!mounted ? (
          <p className="text-muted">불러오는 중…</p>
        ) : (
          <>
            <HistoryStats sessions={history} />
            <WorkoutCalendar sessions={history} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

            <div className="flex flex-col gap-md">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
              </h2>
              {daySessions.length === 0 ? (
                <p className="rounded-lg border border-card-border bg-glass p-lg text-sm text-muted">
                  이 날은 기록이 없어요.
                </p>
              ) : (
                daySessions.map((session) => <SessionLogCard key={session.id} session={session} />)
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
