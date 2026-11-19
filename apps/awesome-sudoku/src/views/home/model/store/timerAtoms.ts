import { atom } from 'jotai';
import { currentTimeAtom, timerActiveAtom } from './primitives';

export const incrementTimerAtom = atom(null, (get, set, seconds: number = 1) => {
  if (get(timerActiveAtom)) {
    set(currentTimeAtom, get(currentTimeAtom) + seconds);
  }
});

export const toggleTimerAtom = atom(null, (get, set, isActive?: boolean) => {
  if (isActive !== undefined) {
    set(timerActiveAtom, isActive);
    return;
  }
  set(timerActiveAtom, !get(timerActiveAtom));
});
