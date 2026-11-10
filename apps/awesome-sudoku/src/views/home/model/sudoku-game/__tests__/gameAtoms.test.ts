import { cellAt } from '@entities/game/lib/gridAccess';
import {
  CLASSIC_DIFFICULTY,
  GAME_LEVEL,
  GAME_MODE,
  HINTS_REMAINING,
  MAX_MISTAKES,
} from '@entities/game/model/constants/game';
import { fillCellAtom } from '@entities/game/model/store/cellValueAtoms';
import { initializeGameAtom } from '@entities/game/model/store/gameLifecycleAtoms';
import { getHintAtom } from '@entities/game/model/store/hintAtoms';
import { canRedoAtom, canUndoAtom, futureAtom, redoAtom, undoAtom } from '@entities/game/model/store/historyAtoms';
import { handleKeyInputAtom } from '@entities/game/model/store/keyboardAtoms';
import {
  boardAtom,
  cagesAtom,
  difficultyAtom,
  gameModeAtom,
  hintsRemainingAtom,
  isCompletedAtom,
  isGeneratingAtom,
  isNoteModeAtom,
  isSuccessAtom,
  mistakeCountAtom,
  selectedCellAtom,
  solutionAtom,
  timerActiveAtom,
} from '@entities/game/model/store/primitives';
import type { Grid, SudokuBoard } from '@entities/game/model/types/board';
import type { KillerCage } from '@entities/game/model/types/game';
import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

const SOLUTION: Grid = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

/** 정답에서 blanks 칸만 비운 보드 */
const boardWithBlanks = (blanks: [number, number][]): SudokuBoard =>
  SOLUTION.map((row, r) =>
    row.map((value, c) => {
      const isBlank = blanks.some(([br, bc]) => br === r && bc === c);
      return {
        value: isBlank ? null : value,
        isInitial: !isBlank,
        isSelected: false,
        isConflict: false,
        isHint: false,
        notes: [],
      };
    }),
  );

const setupStore = (blanks: [number, number][], cages: KillerCage[] = []) => {
  const store = createStore();
  store.set(boardAtom, boardWithBlanks(blanks));
  store.set(solutionAtom, SOLUTION);
  store.set(gameModeAtom, cages.length > 0 ? GAME_MODE.KILLER : GAME_MODE.CLASSIC);
  store.set(cagesAtom, cages);
  store.set(mistakeCountAtom, 0);
  store.set(hintsRemainingAtom, HINTS_REMAINING);
  store.set(isCompletedAtom, false);
  store.set(isSuccessAtom, false);
  store.set(timerActiveAtom, true);
  return store;
};

describe('fillCellAtom — 실수 판정', () => {
  it('정답을 넣으면 실수가 아니고 충돌 표시도 없다', () => {
    const store = setupStore([
      [0, 0],
      [8, 8],
    ]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(fillCellAtom, cellAt(SOLUTION, 0, 0));

    expect(store.get(mistakeCountAtom)).toBe(0);
    expect(cellAt(store.get(boardAtom), 0, 0).isConflict).toBe(false);
  });

  it('행·열·블록 충돌이 없어도 정답과 다르면 실수이고 충돌로 표시된다', () => {
    // (0,0)=5, (8,8)=9를 비우면 (0,0)에 9는 행·열·블록 어디에도 없어 규칙 충돌은 없다
    const store = setupStore([
      [0, 0],
      [8, 8],
    ]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(fillCellAtom, 9);

    expect(store.get(mistakeCountAtom)).toBe(1);
    expect(cellAt(store.get(boardAtom), 0, 0).value).toBe(9);
    expect(cellAt(store.get(boardAtom), 0, 0).isConflict).toBe(true);
    expect(store.get(isCompletedAtom)).toBe(false);
  });

  it('지우기(null)는 실수가 아니다', () => {
    const store = setupStore([[0, 0]]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(fillCellAtom, 9);
    store.set(fillCellAtom, null);

    expect(store.get(mistakeCountAtom)).toBe(1);
    expect(cellAt(store.get(boardAtom), 0, 0).value).toBeNull();
  });

  it('초기 셀에는 입력이 무시된다', () => {
    const store = setupStore([[0, 0]]);
    store.set(selectedCellAtom, { row: 1, col: 1 });
    store.set(fillCellAtom, 1);

    expect(cellAt(store.get(boardAtom), 1, 1).value).toBe(cellAt(SOLUTION, 1, 1));
    expect(store.get(mistakeCountAtom)).toBe(0);
  });

  it('같은 칸에 같은 값을 다시 넣는 것은 무시된다 — 실수가 중복 카운트되지 않는다', () => {
    const store = setupStore([[0, 0]]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(fillCellAtom, 9);
    store.set(fillCellAtom, 9);

    expect(store.get(mistakeCountAtom)).toBe(1);
  });

  it('실수 한도에 닿으면 게임 오버(완료·실패)이고 마지막 값은 놓이지 않는다', () => {
    const store = setupStore([[0, 0]]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    const wrongValues = [9, 8, 7, 6, 1]; // (0,0) 정답은 5
    expect(wrongValues.length).toBe(MAX_MISTAKES);
    wrongValues.forEach((v) => store.set(fillCellAtom, v));

    expect(store.get(mistakeCountAtom)).toBe(MAX_MISTAKES);
    expect(store.get(isCompletedAtom)).toBe(true);
    expect(store.get(isSuccessAtom)).toBe(false);
    expect(store.get(timerActiveAtom)).toBe(false);
    expect(cellAt(store.get(boardAtom), 0, 0).value).toBe(6);
  });

  it('마지막 칸을 정답으로 채우면 완료·성공이고 타이머가 멈춘다', () => {
    const store = setupStore([[0, 0]]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(fillCellAtom, cellAt(SOLUTION, 0, 0));

    expect(store.get(isCompletedAtom)).toBe(true);
    expect(store.get(isSuccessAtom)).toBe(true);
    expect(store.get(timerActiveAtom)).toBe(false);
    expect(store.get(selectedCellAtom)).toBeNull();
  });

  it('킬러: 케이지 합을 어기는 값은 실수로 잡히고 케이지 전체가 충돌 표시된다', () => {
    const cages: KillerCage[] = [
      {
        id: 1,
        cells: [
          [0, 0],
          [0, 1],
        ],
        sum: cellAt(SOLUTION, 0, 0) + cellAt(SOLUTION, 0, 1),
      },
    ];
    const store = setupStore(
      [
        [0, 0],
        [8, 8],
      ],
      cages,
    );
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(fillCellAtom, 9); // 9 + 3 = 12 > 8

    expect(store.get(mistakeCountAtom)).toBe(1);
    expect(cellAt(store.get(boardAtom), 0, 0).isConflict).toBe(true);
    expect(cellAt(store.get(boardAtom), 0, 1).isConflict).toBe(true);
  });
});

describe('getHintAtom — 대상 칸 선택', () => {
  it('선택한 빈 칸이 있으면 그 칸을 정답으로 채우고 힌트 표시를 남긴다', () => {
    const store = setupStore([
      [0, 0],
      [8, 8],
    ]);
    store.set(selectedCellAtom, { row: 8, col: 8 });
    store.set(getHintAtom);

    const cell = cellAt(store.get(boardAtom), 8, 8);
    expect(cell.value).toBe(cellAt(SOLUTION, 8, 8));
    expect(cell.isHint).toBe(true);
    expect(cellAt(store.get(boardAtom), 0, 0).value).toBeNull();
    expect(store.get(hintsRemainingAtom)).toBe(HINTS_REMAINING - 1);
  });

  it('선택한 칸이 틀린 값이면 그 칸을 고친다', () => {
    const store = setupStore([
      [0, 0],
      [8, 8],
    ]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(fillCellAtom, 9);
    store.set(getHintAtom);

    const cell = cellAt(store.get(boardAtom), 0, 0);
    expect(cell.value).toBe(cellAt(SOLUTION, 0, 0));
    expect(cell.isConflict).toBe(false);
  });

  it('선택한 칸이 이미 맞았으면 다른 미해결 칸을 채운다', () => {
    const store = setupStore([
      [0, 0],
      [8, 8],
    ]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(fillCellAtom, cellAt(SOLUTION, 0, 0));
    store.set(getHintAtom);

    expect(cellAt(store.get(boardAtom), 8, 8).value).toBe(cellAt(SOLUTION, 8, 8));
    expect(store.get(selectedCellAtom)).toEqual({ row: 8, col: 8 });
  });

  it('선택이 없으면 미해결 칸 중 하나를 채운다', () => {
    const store = setupStore([[0, 0]]);
    store.set(selectedCellAtom, null);
    store.set(getHintAtom);

    expect(cellAt(store.get(boardAtom), 0, 0).value).toBe(cellAt(SOLUTION, 0, 0));
    expect(store.get(isCompletedAtom)).toBe(true);
    expect(store.get(isSuccessAtom)).toBe(true);
  });
});

describe('initializeGameAtom — 비동기 생성', () => {
  it('생성이 끝나면 새 판·난이도·타이머가 세팅되고 생성 플래그가 내려간다', async () => {
    const store = setupStore([[0, 0]]);
    store.set(mistakeCountAtom, 3);

    const pendingInit = store.set(initializeGameAtom, GAME_LEVEL.EASY);
    expect(store.get(isGeneratingAtom)).toBe(true);
    await pendingInit;

    const clues = store
      .get(boardAtom)
      .flat()
      .filter((cell) => cell.value !== null).length;
    expect(clues).toBe(CLASSIC_DIFFICULTY[GAME_LEVEL.EASY].clues);
    expect(store.get(difficultyAtom)).toBe(GAME_LEVEL.EASY);
    expect(store.get(mistakeCountAtom)).toBe(0);
    expect(store.get(isGeneratingAtom)).toBe(false);
    expect(store.get(timerActiveAtom)).toBe(true);
  });

  it('킬러 모드면 케이지가 함께 세팅된다', async () => {
    const store = setupStore([[0, 0]]);
    store.set(gameModeAtom, GAME_MODE.KILLER);

    await store.set(initializeGameAtom, GAME_LEVEL.EASY);

    expect(store.get(cagesAtom).length).toBeGreaterThan(0);
    expect(store.get(cagesAtom).flatMap((cage) => cage.cells).length).toBe(81);
  });
});

describe('undoAtom / redoAtom — 히스토리', () => {
  const valueAt = (store: ReturnType<typeof setupStore>): number | null => cellAt(store.get(boardAtom), 0, 0).value;

  it('입력 → undo → redo 하면 입력 전 보드와 입력 후 값으로 오간다', () => {
    const store = setupStore([
      [0, 0],
      [8, 8],
    ]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(fillCellAtom, 5);

    store.set(undoAtom);
    expect(valueAt(store)).toBeNull();
    expect(store.get(canRedoAtom)).toBe(true);

    store.set(redoAtom);
    expect(valueAt(store)).toBe(5);
    expect(store.get(canRedoAtom)).toBe(false);
    expect(store.get(canUndoAtom)).toBe(true);
  });

  it('undo 뒤에 새로 입력하면 redo 기록이 비워진다', () => {
    const store = setupStore([
      [0, 0],
      [8, 8],
    ]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(fillCellAtom, 5);
    store.set(undoAtom);
    expect(store.get(futureAtom)).toHaveLength(1);

    store.set(fillCellAtom, 5);
    expect(store.get(futureAtom)).toHaveLength(0);
  });

  it('키보드 입력·지우기·메모도 기록된다', () => {
    const store = setupStore([
      [0, 0],
      [8, 8],
    ]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(handleKeyInputAtom, '5');
    store.set(handleKeyInputAtom, 'Backspace');
    store.set(isNoteModeAtom, true);
    store.set(handleKeyInputAtom, '3');

    store.set(undoAtom);
    expect(cellAt(store.get(boardAtom), 0, 0).notes).toEqual([]);
    store.set(undoAtom);
    expect(valueAt(store)).toBe(5);
    store.set(undoAtom);
    expect(valueAt(store)).toBeNull();
    expect(store.get(canUndoAtom)).toBe(false);
  });

  it('끝난 판에서는 입력·undo가 무시된다 — 힌트로 완료한 뒤 Backspace → undo로 판이 다시 열리지 않는다', () => {
    const store = setupStore([[0, 0]]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(getHintAtom);
    expect(store.get(isCompletedAtom)).toBe(true);

    store.set(handleKeyInputAtom, 'Backspace');
    store.set(undoAtom);
    expect(valueAt(store)).toBe(cellAt(SOLUTION, 0, 0));
    expect(store.get(isCompletedAtom)).toBe(true);
    expect(store.get(timerActiveAtom)).toBe(false);
  });

  it('무시되는 입력(같은 값 재입력)은 기록하지 않는다', () => {
    const store = setupStore([
      [0, 0],
      [8, 8],
    ]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(fillCellAtom, 5);
    store.set(fillCellAtom, 5);

    store.set(undoAtom);
    expect(store.get(canUndoAtom)).toBe(false);
  });

  it('undo는 실수 횟수와 힌트를 되돌리지 않는다', () => {
    const store = setupStore([
      [0, 0],
      [8, 8],
    ]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(fillCellAtom, 9);
    store.set(getHintAtom);

    store.set(undoAtom);
    store.set(undoAtom);
    expect(valueAt(store)).toBeNull();
    expect(store.get(mistakeCountAtom)).toBe(1);
    expect(store.get(hintsRemainingAtom)).toBe(HINTS_REMAINING - 1);
  });

  it('되돌린 보드의 선택 표시는 지금 선택한 칸을 따른다', () => {
    const store = setupStore([
      [0, 0],
      [8, 8],
    ]);
    store.set(selectedCellAtom, { row: 0, col: 0 });
    store.set(fillCellAtom, 5);
    store.set(selectedCellAtom, { row: 8, col: 8 });

    store.set(undoAtom);
    const selectedCells = store
      .get(boardAtom)
      .flatMap((row, r) => row.flatMap((cell, c) => (cell.isSelected ? [[r, c]] : [])));
    expect(selectedCells).toEqual([[8, 8]]);
  });
});
