import { countStars } from '@entities/stardoku/model/utils';
import { livesAtom, marksAtom, puzzleAtom } from '@features/stardoku-game/model/atoms/primitives';
import { atom } from 'jotai';

export const starCountAtom = atom((get) => countStars(get(marksAtom)));

/** 보드의 별은 항상 정답 검증을 통과한 것 → 개수가 차면 클리어 */
export const isClearedAtom = atom((get) => {
  const puzzle = get(puzzleAtom);
  return puzzle !== null && get(starCountAtom) === puzzle.size;
});

export const isGameOverAtom = atom((get) => get(livesAtom) <= 0);
