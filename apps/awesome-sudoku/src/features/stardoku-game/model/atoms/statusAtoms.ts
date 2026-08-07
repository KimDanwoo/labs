import { countStars, violatingStarKeys } from '@entities/stardoku/model/utils';
import { livesAtom, marksAtom, puzzleAtom } from '@features/stardoku-game/model/atoms/primitives';
import { atom } from 'jotai';

export const starCountAtom = atom((get) => countStars(get(marksAtom)));

/** 규칙(행·열·구역 중복 / 인접)을 어기는 별들의 셀 키 — 실시간으로 붉게 표시된다 */
export const violatingKeysAtom = atom((get) => {
  const puzzle = get(puzzleAtom);
  if (!puzzle) return new Set<string>();
  return violatingStarKeys(get(marksAtom), puzzle.regions);
});

/**
 * 별이 size개이고 규칙 위반이 없으면 클리어.
 * size개 별이 행·열·구역·인접 제약을 전부 만족하면 비둘기집 원리로 유일해와 일치하므로 정답 대조가 필요 없다.
 */
export const isClearedAtom = atom((get) => {
  const puzzle = get(puzzleAtom);
  if (!puzzle) return false;
  return get(starCountAtom) === puzzle.size && get(violatingKeysAtom).size === 0;
});

export const isGameOverAtom = atom((get) => get(livesAtom) <= 0);
