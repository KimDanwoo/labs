'use client';

import { characterPositionAtom, gameAtom, isPlayingAtom, isSickAtom, wokeUpAtAtom } from '@entities/game/model/store';
import {
  HEART_DECAY_WHEN_SICK,
  HUNGER_DECAY_PER_MINUTE,
  SLEEP_END_HOUR,
  SLEEP_START_HOUR,
  WAKE_UP_GRACE_MS,
} from '@shared/constants';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { useEffect } from 'react';

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
  const store = useStore();

  useEffect(() => {
    if (!isPlaying) return undefined;

    const tick = () => {
      const sleeping = shouldBeSleeping(wokeUpAt, Date.now());
      dispatch({ type: 'SET_SLEEPING', isSleeping: sleeping });
      dispatch({ type: 'DECAY_HUNGER', amount: HUNGER_DECAY_PER_MINUTE / 6 });
      const pos = store.get(characterPositionAtom);
      dispatch({
        type: 'TICK',
        characterPosition: { x: pos.x, y: pos.y },
      });
    };

    tick();
    const interval = setInterval(tick, 10_000);

    return () => clearInterval(interval);
  }, [isPlaying, wokeUpAt, dispatch, store]);

  useEffect(() => {
    if (!isPlaying || !isSick) return undefined;

    const interval = setInterval(() => {
      dispatch({ type: 'DECAY_HEARTS', amount: HEART_DECAY_WHEN_SICK });
    }, 10_000);

    return () => clearInterval(interval);
  }, [isPlaying, isSick, dispatch]);
}
