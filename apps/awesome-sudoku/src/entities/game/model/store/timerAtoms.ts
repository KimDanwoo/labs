import { atom } from 'jotai';
import { currentTimeAtom, timerActiveAtom } from './primitives';

/** 타이머 1초 증가 */
export const incrementTimerAtom = atom(null, (get, set) => {
  if (get(timerActiveAtom)) {
    set(currentTimeAtom, get(currentTimeAtom) + 1);
  }
});

/** 타이머 토글 */
export const toggleTimerAtom = atom(null, (get, set, isActive?: boolean) => {
  if (isActive !== undefined) {
    set(timerActiveAtom, isActive);
    return;
  }
  set(timerActiveAtom, !get(timerActiveAtom));
});
