'use client';

import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  HUNGER_DECAY_PER_MINUTE,
  SLEEP_START_HOUR,
  SLEEP_END_HOUR,
  HEART_DECAY_WHEN_SICK,
  WAKE_UP_GRACE_MS,
} from '@shared/constants';
import {
  gameAtom,
  isPlayingAtom,
  isSickAtom,
  wokeUpAtAtom,
} from '../store';

function isSleepTime(): boolean {
  const hour = new Date().getHours();
  return hour >= SLEEP_START_HOUR || hour < SLEEP_END_HOUR;
}

function shouldBeSleeping(wokeUpAt: number | null, now: number): boolean {
  if (!isSleepTime()) return false;
  if (wokeUpAt === null) return true;
  return now - wokeUpAt > WAKE_UP_GRACE_MS;
}

export function useAutoDecay() {
  const isPlaying = useAtomValue(isPlayingAtom);
  const isSick = useAtomValue(isSickAtom);
  const wokeUpAt = useAtomValue(wokeUpAtAtom);
  const dispatch = useSetAtom(gameAtom);

  useEffect(() => {
    if (!isPlaying) return;

    const tick = () => {
      const sleeping = shouldBeSleeping(wokeUpAt, Date.now());
      dispatch({ type: 'SET_SLEEPING', isSleeping: sleeping });
      dispatch({ type: 'DECAY_HUNGER', amount: HUNGER_DECAY_PER_MINUTE / 6 });
      dispatch({ type: 'TICK' });
    };

    tick();
    const interval = setInterval(tick, 10_000);

    return () => clearInterval(interval);
  }, [isPlaying, wokeUpAt, dispatch]);

  useEffect(() => {
    if (!isPlaying || !isSick) return;

    const interval = setInterval(() => {
      dispatch({ type: 'DECAY_HEARTS', amount: HEART_DECAY_WHEN_SICK });
    }, 10_000);

    return () => clearInterval(interval);
  }, [isPlaying, isSick, dispatch]);
}
