'use client';

import { computeStreak, computeTotalVolume, countRecentSessions } from '@entities/session/model/lib';
import type { WorkoutSession } from '@entities/session/model/types';
import { formatVolume } from '@shared/lib';
import { useMemo } from 'react';

const RECENT_DAYS = 7;

type HistoryStatsProps = {
  sessions: WorkoutSession[];
};

type StatItem = {
  value: string;
  label: string;
};

export function HistoryStats({ sessions }: HistoryStatsProps) {
  const items = useMemo<StatItem[]>(() => {
    const now = new Date();
    return [
      { value: String(sessions.length), label: '총 운동 횟수' },
      { value: String(computeStreak(sessions)), label: '연속 운동(일)' },
      { value: formatVolume(computeTotalVolume(sessions)), label: '누적 볼륨' },
      { value: String(countRecentSessions(sessions, RECENT_DAYS, now)), label: '최근 7일' },
    ];
  }, [sessions]);

  return (
    <div className="grid grid-cols-2 gap-md">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center gap-xs rounded-lg border border-card-border bg-glass p-lg shadow-md"
        >
          <span className="text-3xl font-bold text-primary">{item.value}</span>
          <span className="text-sm text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
