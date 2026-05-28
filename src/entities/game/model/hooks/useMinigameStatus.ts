'use client';

import { useAtomValue } from 'jotai';
import { MINIGAME_DAILY_LIMIT } from '@shared/constants';
import { minigameDayAtom, minigamesTodayAtom } from '../store';

function todayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type MinigameStatus = {
  canPlay: boolean;
  minigamesToday: number;
  dailyLimit: number;
  reachedDailyLimit: boolean;
  today: string;
};

export function useMinigameStatus(): MinigameStatus {
  const minigamesToday = useAtomValue(minigamesTodayAtom);
  const minigameDay = useAtomValue(minigameDayAtom);

  const today = todayKey(Date.now());
  const todaysCount = minigameDay === today ? minigamesToday : 0;
  const reachedDailyLimit = todaysCount >= MINIGAME_DAILY_LIMIT;

  return {
    canPlay: !reachedDailyLimit,
    minigamesToday: todaysCount,
    dailyLimit: MINIGAME_DAILY_LIMIT,
    reachedDailyLimit,
    today,
  };
}
