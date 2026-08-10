import { Rng, StardokuPuzzle } from '@entities/stardoku/model/types';

/** 'A'~ 문자로 그린 구역 맵을 id 격자로. 테스트에서 판 모양을 눈으로 읽히게 쓰기 위한 것 */
export const toRegions = (rows: string[]): number[][] => rows.map((row) => [...row].map((ch) => ch.charCodeAt(0) - 65));

/** 유일해가 검증된 고정 6×6 퍼즐 — 생성기를 타지 않고 결정적으로 규칙을 검증할 때 쓴다 */
export const FIXED_PUZZLE_6: StardokuPuzzle = {
  size: 6,
  regions: toRegions(['CAAAAA', 'CAABBB', 'CCEEBB', 'CCEEDF', 'CCEEFF', 'CEEEEF']),
  solution: [1, 3, 0, 4, 2, 5],
};

/** 선형 합동 생성기 — 시드가 같으면 같은 퍼즐이 나오는지 검증할 때 쓴다 */
export const createRng = (seed: number): Rng => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
};
