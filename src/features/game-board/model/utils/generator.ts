import { BASE_GRID, KEY_NUMBER, MIN_EXPERT_HINTS, SUDOKU_CELL_COUNT } from "@entities/board/model/constants";
import { Grid, SudokuBoard } from "@entities/board/model/types";
import { deepCopyGrid } from "@entities/board/model/utils";
import { DIFFICULTY_RANGES, KILLER_DIFFICULTY_RANGES } from "@entities/game/model/constants";
import { Difficulty, KillerCage } from "@entities/game/model/types";
import {
  applyTransformations,
  generateKillerCages,
  isValidPlacement,
  shuffleArray,
  validateBaseGrid,
  validateCages,
} from "@features/game-board/model/utils";
import { forceRemoveAdditionalCells, removeKillerCells, removeRandomCellsWithStrategy } from "./remove";

/**
 * @description 백트래킹을 이용한 스도쿠 생성
 * @returns {Grid} 유효한 스도쿠 그리드
 */
function generateValidSudoku(): Grid {
  const grid: Grid = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));

  const fillGrid = (row: number, col: number): boolean => {
    if (row === 9) return true;
    if (col === 9) return fillGrid(row + 1, 0);

    const numbers = [...KEY_NUMBER];
    shuffleArray(numbers);

    for (const num of numbers) {
      if (isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;
        if (fillGrid(row, col + 1)) {
          return true;
        }
        grid[row][col] = 0;
      }
    }

    return false;
  };

  if (fillGrid(0, 0)) {
    return grid;
  }

  return deepCopyGrid(BASE_GRID);
}

/**
 * @description 솔루션 생성
 * @returns {Grid} 유효한 스도쿠 그리드
 */
export function generateSolution(): Grid {
  if (!validateBaseGrid(BASE_GRID)) {
    const newGrid = generateValidSudoku();
    applyTransformations(newGrid);
    return newGrid;
  }

  const solution = deepCopyGrid(BASE_GRID);
  applyTransformations(solution);

  if (!validateBaseGrid(solution)) {
    return generateValidSudoku();
  }

  return solution;
}

/**
 * @description 초기 보드 생성
 * @param {Grid} solution - 솔루션 그리드
 * @returns {SudokuBoard} 초기 보드
 */
export function createInitialBoard(solution: Grid): SudokuBoard {
  return solution.map((row) =>
    row.map((value) => ({
      value,
      isInitial: true,
      isSelected: false,
      isConflict: false,
      notes: [],
    })),
  );
}

/**
 * @description 일반 스도쿠 보드 생성
 * @param {Grid} solution - 솔루션
 * @param {Difficulty} difficulty - 난이도
 * @returns {SudokuBoard} 보드
 */
export function generateBoard(solution: Grid, difficulty: Difficulty): SudokuBoard {
  const board = createInitialBoard(solution);
  const { min, max } = DIFFICULTY_RANGES[difficulty];
  const targetHints = min + Math.floor(Math.random() * (max - min + 1));
  const targetRemove = SUDOKU_CELL_COUNT - targetHints;

  const removed = removeRandomCellsWithStrategy(board, targetRemove, difficulty);

  if (removed < targetRemove - 5) {
    forceRemoveAdditionalCells(board, targetRemove - removed);
  }

  return board;
}

/**
 * @description 킬러 스도쿠 보드 생성
 * @param {Grid} solution - 솔루션
 * @param {Difficulty} difficulty - 난이도
 * @returns {SudokuBoard} 보드
 */
export function generateKillerBoard(
  solution: Grid,
  difficulty: Difficulty,
): { board: SudokuBoard; cages: KillerCage[] } {
  const board = createInitialBoard(solution);
  const cages = generateKillerCages(solution, difficulty);

  if (!validateCages(cages, solution)) {
    return generateKillerBoard(solution, difficulty);
  }

  const { hintsKeep } = KILLER_DIFFICULTY_RANGES[difficulty];
  const targetHints = difficulty === "expert" ? Math.max(MIN_EXPERT_HINTS, hintsKeep) : hintsKeep;
  const targetRemove = SUDOKU_CELL_COUNT - targetHints;

  removeKillerCells(board, cages, targetRemove, difficulty);

  return { board, cages };
}
