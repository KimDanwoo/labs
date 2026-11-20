import { currentTimeAtom, timerActiveAtom } from '@entities/sudoku/model/store/primitives';
import { atom } from 'jotai';

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
