import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';

import {
  currentTimeAtom,
  formatTime,
  incrementTimerAtom,
  isCompletedAtom,
  timerActiveAtom,
  toggleTimerAtom,
} from '@entities/game';

import { TIMER_STATE, TIMER_TICK_MS, type TimerState } from '../../../config/timer';

function toTimerState(isCompleted: boolean, timerActive: boolean): TimerState {
  if (isCompleted) return TIMER_STATE.completed;
  return timerActive ? TIMER_STATE.running : TIMER_STATE.paused;
}

export function useGameTimer() {
  const currentTime = useAtomValue(currentTimeAtom);
  const timerActive = useAtomValue(timerActiveAtom);
  const isCompleted = useAtomValue(isCompletedAtom);
  const incrementTimer = useSetAtom(incrementTimerAtom);
  const toggleTimer = useSetAtom(toggleTimerAtom);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerActive && !isCompleted) {
      timerRef.current = setInterval(incrementTimer, TIMER_TICK_MS);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerActive, isCompleted, incrementTimer]);

  const state = toTimerState(isCompleted, timerActive);

  return {
    formattedTime: formatTime(currentTime),
    timerActive,
    isCompleted,
    state,
    toggle: () => toggleTimer(!timerActive),
  };
}
