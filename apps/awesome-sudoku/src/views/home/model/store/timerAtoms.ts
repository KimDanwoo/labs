import { atom } from 'jotai';
import { currentTimeAtom, timerActiveAtom } from './primitives';

export const incrementTimerAtom = atom(null, (get, set) => {
  if (get(timerActiveAtom)) {
    set(currentTimeAtom, get(currentTimeAtom) + 1);
  }
});

export const toggleTimerAtom = atom(null, (get, set, isActive?: boolean) => {
  if (isActive !== undefined) {
    set(timerActiveAtom, isActive);
    return;
  }
  set(timerActiveAtom, !get(timerActiveAtom));
});
