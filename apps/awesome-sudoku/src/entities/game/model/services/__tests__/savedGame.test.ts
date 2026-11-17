import { GAME_MODE } from '@entities/game/model/constants/game';
import { createEmptyBoard, createEmptyGrid } from '@entities/game/model/services/common';
import { isBoardPosition, isRestorableGame } from '@entities/game/model/services/savedGame';
import type { Grid, SudokuBoard } from '@entities/game/model/types/board';
import type { KillerCage } from '@entities/game/model/types/game';
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

const WRONG_VALUE = 9;

const boardOf = (isInitial: (row: number, col: number) => boolean): SudokuBoard =>
  SOLUTION.map((row, rowIndex) =>
    row.map((value, colIndex) => ({
      value: isInitial(rowIndex, colIndex) ? value : null,
      isInitial: isInitial(rowIndex, colIndex),
      isSelected: false,
      isConflict: false,
      isHint: false,
      notes: [],
    })),
  );

const CLASSIC_BOARD = boardOf((row, col) => (row + col) % 2 === 0);
const KILLER_BOARD = boardOf(() => false);
const CAGE: KillerCage = {
  id: 1,
  sum: 8,
  cells: [
    [0, 0],
    [0, 1],
  ],
};

const classicGame = (board: unknown = CLASSIC_BOARD, solution: unknown = SOLUTION) => ({
  board,
  solution,
  gameMode: GAME_MODE.CLASSIC,
  cages: [],
});

describe('isRestorableGame — 저장된 판을 이어 할 수 있는지', () => {
  it('초기 칸이 정답과 맞는 판은 이어 할 수 있다 — 사용자가 틀리게 채운 칸이 있어도 된다', () => {
    const played = CLASSIC_BOARD.map((row, rowIndex) =>
      row.map((cell, colIndex) => (rowIndex === 0 && colIndex === 1 ? { ...cell, value: WRONG_VALUE } : cell)),
    );

    expect(isRestorableGame(classicGame())).toBe(true);
    expect(isRestorableGame(classicGame(played))).toBe(true);
  });

  it('저장된 판이 없으면(빈 보드·빈 정답) 이어 할 수 없다', () => {
    expect(isRestorableGame(classicGame(createEmptyBoard(), createEmptyGrid()))).toBe(false);
  });

  it('정답이 비어 있거나 초기 칸이 정답과 다르면 이어 할 수 없다', () => {
    const mismatched = CLASSIC_BOARD.map((row, rowIndex) =>
      row.map((cell, colIndex) => (rowIndex === 0 && colIndex === 0 ? { ...cell, value: WRONG_VALUE } : cell)),
    );

    expect(isRestorableGame(classicGame(CLASSIC_BOARD, createEmptyGrid()))).toBe(false);
    expect(isRestorableGame(classicGame(mismatched))).toBe(false);
  });

  it('모양이 깨진 값은 이어 할 수 없다', () => {
    expect(isRestorableGame(classicGame(null))).toBe(false);
    expect(isRestorableGame(classicGame(CLASSIC_BOARD.slice(1)))).toBe(false);
    expect(isRestorableGame(classicGame([...CLASSIC_BOARD.slice(1), [{ value: 'x' }]]))).toBe(false);
    expect(isRestorableGame(classicGame(CLASSIC_BOARD, 'solution'))).toBe(false);
  });

  it('킬러 판은 초기 칸이 없어도 되지만 케이지는 있어야 한다', () => {
    const killerGame = (cages: KillerCage[]) => ({
      board: KILLER_BOARD,
      solution: SOLUTION,
      gameMode: GAME_MODE.KILLER,
      cages,
    });

    expect(isRestorableGame(killerGame([CAGE]))).toBe(true);
    expect(isRestorableGame(killerGame([]))).toBe(false);
  });

  it('모드를 바꾸는 도중에 저장된 판(클래식 모드인데 케이지가 남은 킬러 보드)은 이어 할 수 없다', () => {
    expect(isRestorableGame({ ...classicGame(KILLER_BOARD), cages: [CAGE] })).toBe(false);
  });

  it('케이지가 배열이 아니면 이어 할 수 없다', () => {
    expect(isRestorableGame({ ...classicGame(), cages: null })).toBe(false);
  });
});

describe('isBoardPosition — 저장된 선택 칸', () => {
  it('보드 안의 정수 좌표만 받는다', () => {
    expect(isBoardPosition({ row: 0, col: 8 })).toBe(true);
    expect(isBoardPosition({ row: 9, col: 0 })).toBe(false);
    expect(isBoardPosition({ row: 1.5, col: 0 })).toBe(false);
    expect(isBoardPosition({ row: 1 })).toBe(false);
    expect(isBoardPosition(null)).toBe(false);
  });
});
