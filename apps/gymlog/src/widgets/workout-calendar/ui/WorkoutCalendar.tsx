'use client';

import type { WorkoutSession } from '@entities/session/model/types';
import { toDateKey } from '@shared/lib';
import { useMemo, useState } from 'react';
import { CalendarDayCell } from './CalendarDayCell';

type WorkoutCalendarProps = {
  sessions: WorkoutSession[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

const buildCells = (year: number, month: number): (number | null)[] => {
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = Array.from({ length: startWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  while (cells.length % WEEKDAYS.length !== 0) {
    cells.push(null);
  }
  return cells;
};

export function WorkoutCalendar({ sessions, selectedDate, onSelectDate }: WorkoutCalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const workoutDayKeys = useMemo(
    () => new Set(sessions.map((session) => toDateKey(new Date(session.startedAt)))),
    [sessions],
  );

  const cells = useMemo(() => buildCells(year, month), [year, month]);
  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(selectedDate);

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const handleSelectDay = (day: number) => onSelectDate(new Date(year, month, day));

  return (
    <div className="flex flex-col gap-md rounded-lg border border-card-border bg-glass p-lg shadow-md backdrop-blur-md">
      <div className="flex items-center justify-between">
        <button type="button" onClick={handlePrevMonth} className="px-sm text-muted hover:text-foreground">
          ‹
        </button>
        <span className="text-lg font-semibold text-foreground">
          {year}년 {month + 1}월
        </span>
        <button type="button" onClick={handleNextMonth} className="px-sm text-muted hover:text-foreground">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-xs">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="py-xs text-center text-xs text-muted">
            {weekday}
          </div>
        ))}
        {cells.map((day, index) => {
          const cellKey = day === null ? `blank-${index}` : `day-${day}`;
          return (
            <CalendarDayCell
              key={cellKey}
              day={day}
              isToday={day !== null && toDateKey(new Date(year, month, day)) === todayKey}
              isSelected={day !== null && toDateKey(new Date(year, month, day)) === selectedKey}
              hasWorkout={day !== null && workoutDayKeys.has(toDateKey(new Date(year, month, day)))}
              onSelect={handleSelectDay}
            />
          );
        })}
      </div>
    </div>
  );
}
