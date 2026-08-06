import { CELL_MARK, GAME_OVER_PENALTY, MAX_HINTS, MAX_LIVES } from '@entities/stardoku/model/constants';
import { StardokuPuzzle } from '@entities/stardoku/model/types';
import { createEmptyMarks, markAt } from '@entities/stardoku/model/utils';
import {
  applyHintAtom,
  hintsRemainingAtom,
  isClearedAtom,
  isGameOverAtom,
  livesAtom,
  marksAtom,
  puzzleAtom,
  restartBoardAtom,
  scoreAtom,
  stageAtom,
  tapCellAtom,
} from '@features/stardoku-game/model/atoms';
import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

const toRegions = (rows: string[]): number[][] => rows.map((row) => [...row].map((ch) => ch.charCodeAt(0) - 65));

/** 유일해가 검증된 고정 6×6 퍼즐 (솔버 테스트와 동일) */
const PUZZLE: StardokuPuzzle = {
  size: 6,
  regions: toRegions(['CAAAAA', 'CAABBB', 'CCEEBB', 'CCEEDF', 'CCEEFF', 'CEEEEF']),
  solution: [1, 3, 0, 4, 2, 5],
};

const setupStore = () => {
  const store = createStore();
  store.set(puzzleAtom, PUZZLE);
  store.set(marksAtom, createEmptyMarks(PUZZLE.size));
  store.set(livesAtom, MAX_LIVES);
  store.set(hintsRemainingAtom, MAX_HINTS);
  store.set(scoreAtom, 0);
  store.set(stageAtom, 3);
  return store;
};

let clock = 0;
/** 더블탭(빈칸 탭 → 연속 탭)으로 별 배치 시도 */
const doubleTap = (store: ReturnType<typeof createStore>, row: number, col: number) => {
  clock += 1000;
  store.set(tapCellAtom, { row, col, time: clock });
  store.set(tapCellAtom, { row, col, time: clock + 100 });
};

describe('별도쿠 점수 시스템', () => {
  it('힌트 없이 클리어하면 +3점', () => {
    const store = setupStore();
    PUZZLE.solution.forEach((col, row) => doubleTap(store, row, col));

    expect(store.get(isClearedAtom)).toBe(true);
    expect(store.get(scoreAtom)).toBe(MAX_HINTS);
  });

  it('힌트 1개 쓰고 클리어하면 +2점', () => {
    const store = setupStore();
    store.set(applyHintAtom);
    expect(store.get(hintsRemainingAtom)).toBe(MAX_HINTS - 1);

    PUZZLE.solution.forEach((col, row) => {
      if (markAt(store.get(marksAtom), row, col) !== CELL_MARK.STAR) doubleTap(store, row, col);
    });

    expect(store.get(isClearedAtom)).toBe(true);
    expect(store.get(scoreAtom)).toBe(MAX_HINTS - 1);
  });

  it('오답 별 3번이면 게임 오버 + 감점, 이어서 이전 스테이지로 후퇴한다', () => {
    const store = setupStore();
    for (let i = 0; i < MAX_LIVES; i++) doubleTap(store, 0, 0); // 정답은 (0,1) — (0,0)은 오답

    expect(store.get(livesAtom)).toBe(0);
    expect(store.get(isGameOverAtom)).toBe(true);
    expect(store.get(scoreAtom)).toBe(-GAME_OVER_PENALTY);

    store.set(restartBoardAtom); // 게임 오버 상태의 모든 탈출구는 후퇴로 수렴
    expect(store.get(stageAtom)).toBe(2);
    expect(store.get(livesAtom)).toBe(MAX_LIVES);
    expect(store.get(scoreAtom)).toBe(-GAME_OVER_PENALTY); // 감점은 1회만
  });

  it('오답 별은 목숨만 깎고 보드에 남지 않는다', () => {
    const store = setupStore();
    doubleTap(store, 0, 0);

    expect(markAt(store.get(marksAtom), 0, 0)).toBe(CELL_MARK.EMPTY);
    expect(store.get(livesAtom)).toBe(MAX_LIVES - 1);
    expect(store.get(scoreAtom)).toBe(0); // 게임 오버 전에는 감점 없음
  });
});
