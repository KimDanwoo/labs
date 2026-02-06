import { BOARD_SIZE } from "@entities/board/model/constants";
import { Grid, SudokuBoard, SudokuCell } from "@entities/board/model/types";
import { Difficulty } from "@entities/game/model/types";
import {
  removeRandomCellsWithStrategy,
} from "@features/sudoku-game/model/utils/remove";
import { hasUniqueSolution } from "@features/sudoku-game/model/utils/validator";
import { describe, expect, it } from "vitest";

const validSolution: Grid = [
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

function createBoardFromSolution(solution: Grid): SudokuBoard {
  return solution.map((row) =>
    row.map((value): SudokuCell => ({
      value,
      isInitial: true,
      isSelected: false,
      isConflict: false,
      isHint: false,
      notes: [],
    })),
  );
}

function countFilledCells(board: SudokuBoard): number {
  return board.flat().filter((cell) => cell.value !== null).length;
}

function boardToGrid(board: SudokuBoard): (number | null)[][] {
  return board.map((row) => row.map((cell) => cell.value));
}

describe("removeRandomCellsWithStrategy", () => {
  it("지정된 수만큼 셀을 제거해야 한다", () => {
    const board = createBoardFromSolution(validSolution);
    const targetRemove = 30;

    const removed = removeRandomCellsWithStrategy(
      board, validSolution, targetRemove, "easy",
    );

    expect(removed).toBeGreaterThan(0);
    expect(removed).toBeLessThanOrEqual(targetRemove);
    expect(countFilledCells(board)).toBe(81 - removed);
  });

  it("제거 후 유일해가 보장되어야 한다", () => {
    const board = createBoardFromSolution(validSolution);
    const targetRemove = 40;

    removeRandomCellsWithStrategy(
      board, validSolution, targetRemove, "easy",
    );

    const grid = boardToGrid(board);
    expect(hasUniqueSolution(grid)).toBe(true);
  });

  it("제거된 셀은 isInitial이 false여야 한다", () => {
    const board = createBoardFromSolution(validSolution);

    removeRandomCellsWithStrategy(
      board, validSolution, 30, "medium",
    );

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cell = board[row][col];
        if (cell.value === null) {
          expect(cell.isInitial).toBe(false);
        }
      }
    }
  });

  it("제거되지 않은 셀은 원래 값과 isInitial을 유지해야 한다", () => {
    const board = createBoardFromSolution(validSolution);

    removeRandomCellsWithStrategy(
      board, validSolution, 30, "easy",
    );

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cell = board[row][col];
        if (cell.value !== null) {
          expect(cell.value).toBe(validSolution[row][col]);
          expect(cell.isInitial).toBe(true);
        }
      }
    }
  });

  it.each<Difficulty>([
    "easy", "medium", "hard", "expert",
  ])("%s 난이도에서 유일해를 보장해야 한다", (difficulty) => {
    const board = createBoardFromSolution(validSolution);
    const targetMap: Record<Difficulty, number> = {
      expert: 62, hard: 55, medium: 51, easy: 41,
    };
    const targetRemove = targetMap[difficulty];

    removeRandomCellsWithStrategy(
      board, validSolution, targetRemove, difficulty,
    );

    const grid = boardToGrid(board);
    expect(hasUniqueSolution(grid)).toBe(true);
  });

  it("보드 구조가 제거 후에도 유지되어야 한다", () => {
    const board = createBoardFromSolution(validSolution);

    removeRandomCellsWithStrategy(
      board, validSolution, 30, "easy",
    );

    expect(board).toHaveLength(BOARD_SIZE);
    expect(board[0]).toHaveLength(BOARD_SIZE);

    board.forEach((row) => {
      row.forEach((cell) => {
        expect(cell).toHaveProperty("value");
        expect(cell).toHaveProperty("isInitial");
        expect(cell).toHaveProperty("isSelected");
        expect(cell).toHaveProperty("isConflict");
        expect(cell).toHaveProperty("notes");
      });
    });
  });
});
