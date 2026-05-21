'use client';

import { useEffect } from 'react';
import type { GameAction } from '@shared/types';
import {
  HUNGER_DECAY_PER_MINUTE,
  SLEEP_START_HOUR,
  SLEEP_END_HOUR,
  HEART_DECAY_WHEN_SICK,
} from '@shared/constants';

function isSleepTime(): boolean {
  const hour = new Date().getHours();
  return hour >= SLEEP_START_HOUR || hour < SLEEP_END_HOUR;
}

export function useAutoDecay(
  isPlaying: boolean,
  isSick: boolean,
  dispatch: React.Dispatch<GameAction>,
) {
  // 배고픔 감소 + 수면 체크 + 사망 체크 (10초마다)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const sleeping = isSleepTime();
      dispatch({ type: 'SET_SLEEPING', isSleeping: sleeping });
      dispatch({ type: 'DECAY_HUNGER', amount: HUNGER_DECAY_PER_MINUTE / 6 });
      dispatch({ type: 'TICK' });
    }, 10_000);

    return () => clearInterval(interval);
  }, [isPlaying, dispatch]);

  // 아플 때 행복도 감소 (10초마다)
  useEffect(() => {
    if (!isPlaying || !isSick) return;

    const interval = setInterval(() => {
      dispatch({ type: 'DECAY_HEARTS', amount: HEART_DECAY_WHEN_SICK });
    }, 10_000);

    return () => clearInterval(interval);
  }, [isPlaying, isSick, dispatch]);
}
