import { toDateKey } from '@shared/lib';
import type { WorkoutSession } from '../types/session';

// 오늘(또는 어제)부터 거꾸로 이어지는 연속 운동 일수.
export const computeStreak = (sessions: WorkoutSession[]): number => {
  const dayKeys = new Set(sessions.map((session) => toDateKey(new Date(session.startedAt))));
  const cursor = new Date();

  if (!dayKeys.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (dayKeys.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};
