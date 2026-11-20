import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { elapsedTicks } from '@entities/sudoku/lib/elapsedTicks';
import { currentTimeAtom, isCompletedAtom, timerActiveAtom } from '@entities/sudoku/model/store/primitives';
import { incrementTimerAtom, toggleTimerAtom } from '@entities/sudoku/model/store/timerAtoms';
import { formatTime } from '@shared/lib/formatTime';

import { TIMER_STATE, TIMER_TICK_MS, type TimerState } from '@entities/sudoku/config/timer';

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

  useEffect(() => {
    const isTicking = timerActive && !isCompleted;
    if (!isTicking) return undefined;
    let last = Date.now();
    let carryMs = 0;
    const id = setInterval(() => {
      const now = Date.now();
      const elapsed = elapsedTicks(now - last + carryMs, TIMER_TICK_MS);
      last = now;
      carryMs = elapsed.carryMs;
      if (elapsed.ticks > 0) incrementTimer(elapsed.ticks);
    }, TIMER_TICK_MS);
    return () => clearInterval(id);
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
