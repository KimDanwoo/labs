import { FIXED_PUZZLE_6 as PUZZLE } from '@entities/stardoku/model/__tests__/fixtures';
import { CELL_MARK, GAME_OVER_PENALTY, MAX_HINTS, MAX_LIVES } from '@entities/stardoku/model/constants';
import { cellKey, createEmptyMarks, markAt } from '@entities/stardoku/model/utils';
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
  violatingKeysAtom,
} from '@features/stardoku-game/model/atoms';
import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

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
/** 더블탭(빈칸 탭 → 연속 탭)으로 별 배치 */
const placeStar = (store: ReturnType<typeof createStore>, row: number, col: number) => {
  clock += 1000;
  store.set(tapCellAtom, { row, col, time: clock });
  store.set(tapCellAtom, { row, col, time: clock + 100 });
};

const solve = (store: ReturnType<typeof createStore>) =>
  PUZZLE.solution.forEach((col, row) => {
    if (markAt(store.get(marksAtom), row, col) !== CELL_MARK.STAR) placeStar(store, row, col);
  });

describe('별도쿠 자기검증 규칙', () => {
  it('정답이 아니어도 규칙만 지키면 별을 놓을 수 있다 — 게임이 대신 검증하지 않는다', () => {
    const store = setupStore();
    placeStar(store, 0, 0); // 정답은 (0,1)

    expect(markAt(store.get(marksAtom), 0, 0)).toBe(CELL_MARK.STAR);
    expect(store.get(livesAtom)).toBe(MAX_LIVES);
    expect(store.get(violatingKeysAtom).size).toBe(0);
  });

  it('규칙 위반 별(같은 행)은 남되 양쪽 모두 위반으로 표시되고 목숨이 1 줄어든다', () => {
    const store = setupStore();
    placeStar(store, 0, 0);
    placeStar(store, 0, 4); // 같은 행 — 위반

    expect(markAt(store.get(marksAtom), 0, 4)).toBe(CELL_MARK.STAR);
    expect(store.get(violatingKeysAtom)).toEqual(new Set([cellKey(0, 0), cellKey(0, 4)]));
    expect(store.get(livesAtom)).toBe(MAX_LIVES - 1);
  });

  it('인접(대각 포함) 배치도 규칙 위반이다', () => {
    const store = setupStore();
    placeStar(store, 0, 0);
    placeStar(store, 1, 1);

    expect(store.get(violatingKeysAtom).size).toBe(2);
    expect(store.get(livesAtom)).toBe(MAX_LIVES - 1);
  });

  it('별을 다 채워도 규칙 위반이 남아 있으면 클리어가 아니다', () => {
    const store = setupStore();
    // 행 0에 2개, 나머지 행에 순차 배치 — 개수는 채우되 규칙은 어긴 상태
    placeStar(store, 0, 0);
    placeStar(store, 0, 4);
    [2, 3, 4, 5].forEach((row) => placeStar(store, row, PUZZLE.solution[row] ?? 0));

    expect(store.get(violatingKeysAtom).size).toBeGreaterThan(0);
    expect(store.get(isClearedAtom)).toBe(false);
  });
});

describe('별도쿠 점수 시스템', () => {
  it('힌트 없이 클리어하면 +3점', () => {
    const store = setupStore();
    solve(store);

    expect(store.get(isClearedAtom)).toBe(true);
    expect(store.get(scoreAtom)).toBe(MAX_HINTS);
  });

  it('힌트 1개 쓰고 클리어하면 +2점', () => {
    const store = setupStore();
    store.set(applyHintAtom);
    expect(store.get(hintsRemainingAtom)).toBe(MAX_HINTS - 1);

    solve(store);

    expect(store.get(isClearedAtom)).toBe(true);
    expect(store.get(scoreAtom)).toBe(MAX_HINTS - 1);
  });

  it('힌트는 자리를 막고 있던 잘못된 별을 치우고 들어온다 — 힌트가 위반을 만들면 안 된다', () => {
    const store = setupStore();
    const hintRow = 0;
    const answerCol = PUZZLE.solution[hintRow] ?? 0;
    placeStar(store, hintRow, answerCol === 0 ? 2 : 0); // 정답 자리와 같은 행의 다른 칸

    store.set(applyHintAtom);

    expect(store.get(violatingKeysAtom).size).toBe(0);
  });

  it('규칙 위반 3번이면 게임 오버 + 감점, 이어서 이전 스테이지로 후퇴한다', async () => {
    const store = setupStore();
    placeStar(store, 0, 0);
    placeStar(store, 0, 2); // 위반 1
    placeStar(store, 0, 4); // 위반 2
    placeStar(store, 2, 0); // 위반 3 (0,0)과 같은 열

    expect(store.get(livesAtom)).toBe(0);
    expect(store.get(isGameOverAtom)).toBe(true);
    expect(store.get(scoreAtom)).toBe(-GAME_OVER_PENALTY);

    await store.set(restartBoardAtom); // 게임 오버 상태의 모든 탈출구는 후퇴로 수렴
    expect(store.get(stageAtom)).toBe(2);
    expect(store.get(livesAtom)).toBe(MAX_LIVES);
    expect(store.get(scoreAtom)).toBe(-GAME_OVER_PENALTY); // 감점은 1회만
  });
});

describe('랭킹 무결성', () => {
  it('다시 시작은 마킹만 지운다 — 힌트를 복구해주면 답을 파악한 뒤 리셋해 만점을 받을 수 있다', () => {
    const store = setupStore();
    // 힌트는 정답 별을 무작위로 고른다 — 어디에 놓였는지에 따라 아래 배치가 위반이 되기도 해서
    // 실제 호출 대신 "1개 쓴 상태"를 직접 만든다
    store.set(hintsRemainingAtom, MAX_HINTS - 1);
    placeStar(store, 0, 0);
    placeStar(store, 0, 4); // 규칙 위반 — 목숨 1 소모
    expect(store.get(hintsRemainingAtom)).toBe(MAX_HINTS - 1);
    expect(store.get(livesAtom)).toBe(MAX_LIVES - 1);

    store.set(restartBoardAtom);

    expect(
      store
        .get(marksAtom)
        .flat()
        .every((mark) => mark === CELL_MARK.EMPTY),
    ).toBe(true);
    expect(store.get(hintsRemainingAtom)).toBe(MAX_HINTS - 1); // 소모된 채 유지
    expect(store.get(livesAtom)).toBe(MAX_LIVES - 1);
  });

  it('다시 시작 후 클리어해도 이미 쓴 힌트만큼만 점수를 준다', () => {
    const store = setupStore();
    store.set(applyHintAtom);
    store.set(restartBoardAtom);
    solve(store);

    expect(store.get(isClearedAtom)).toBe(true);
    expect(store.get(scoreAtom)).toBe(MAX_HINTS - 1);
  });
});
