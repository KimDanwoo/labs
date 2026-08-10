import { countStars, isPuzzleSolved, violatingStarKeys } from '@entities/stardoku/model/utils';
import { livesAtom, marksAtom, puzzleAtom } from '@features/stardoku-game/model/atoms/primitives';
import { atom } from 'jotai';

export const starCountAtom = atom((get) => countStars(get(marksAtom)));

/** 규칙(행·열·구역 중복 / 인접)을 어기는 별들의 셀 키 — 실시간으로 붉게 표시된다 */
export const violatingKeysAtom = atom((get) => {
  const puzzle = get(puzzleAtom);
  if (!puzzle) return new Set<string>();
  return violatingStarKeys(get(marksAtom), puzzle.regions);
});

export const isClearedAtom = atom((get) => {
  const puzzle = get(puzzleAtom);
  if (!puzzle) return false;
  return isPuzzleSolved(get(marksAtom), puzzle.size, puzzle.regions);
});

export const isGameOverAtom = atom((get) => get(livesAtom) <= 0);
