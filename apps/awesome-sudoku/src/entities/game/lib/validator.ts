import { BLOCKS_PER_ROW, BLOCK_SIZE, BOARD_SIZE } from '../model/constants/board';
import type { Grid, SudokuBoard } from '../model/types/board';
import type { KillerCage } from '../model/types/game';
import { getBlockNumbers, getColumnNumbers, getRowNumbers, isValidNumberSet } from './gameUtils';
import { cellAt } from './gridAccess';

export function isValidSolution(grid: Grid): boolean {
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (!isValidNumberSet(getRowNumbers(grid, i)) || !isValidNumberSet(getColumnNumbers(grid, i))) return false;
  }
  for (let blockRow = 0; blockRow < BLOCKS_PER_ROW; blockRow++) {
    for (let blockCol = 0; blockCol < BLOCKS_PER_ROW; blockCol++) {
      if (!isValidNumberSet(getBlockNumbers(grid, blockRow, blockCol))) return false;
    }
  }
  return true;
}

/**
 * @description 사용자가 채운 값이 정답과 다르면 충돌로 표시한다. 퍼즐은 유일해라 정답과 다른 값은 반드시 오답이다.
 */
export function markWrongValues(board: SudokuBoard, solution: Grid): SudokuBoard {
  return board.map((row, r) =>
    row.map((cell, c) => {
      const isWrong = !cell.isInitial && cell.value !== null && cell.value !== cellAt(solution, r, c);
      return isWrong && !cell.isConflict ? { ...cell, isConflict: true } : cell;
    }),
  );
}

export function checkConflicts(board: SudokuBoard): SudokuBoard {
  const newBoard = structuredClone(board);

  const conflicts = new Set<string>();

  for (let row = 0; row < BOARD_SIZE; row++) {
    const seen = new Map<number, number[]>();
    for (let col = 0; col < BOARD_SIZE; col++) {
      const value = cellAt(newBoard, row, col).value;
      if (value !== null) {
        if (!seen.has(value)) {
          seen.set(value, []);
        }
        seen.get(value)!.push(col);
      }
    }

    for (const [, positions] of seen) {
      if (positions.length > 1) {
        positions.forEach((col) => conflicts.add(`${row}-${col}`));
      }
    }
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    const seen = new Map<number, number[]>();
    for (let row = 0; row < BOARD_SIZE; row++) {
      const value = cellAt(newBoard, row, col).value;
      if (value !== null) {
        if (!seen.has(value)) {
          seen.set(value, []);
        }
        seen.get(value)!.push(row);
      }
    }

    for (const [, positions] of seen) {
      if (positions.length > 1) {
        positions.forEach((row) => conflicts.add(`${row}-${col}`));
      }
    }
  }

  for (let blockRow = 0; blockRow < BLOCKS_PER_ROW; blockRow++) {
    for (let blockCol = 0; blockCol < BLOCKS_PER_ROW; blockCol++) {
      const seen = new Map<number, Array<[number, number]>>();

      for (let r = 0; r < BLOCK_SIZE; r++) {
        for (let c = 0; c < BLOCK_SIZE; c++) {
          const row = blockRow * BLOCK_SIZE + r;
          const col = blockCol * BLOCK_SIZE + c;
          const value = cellAt(newBoard, row, col).value;

          if (value !== null) {
            if (!seen.has(value)) {
              seen.set(value, []);
            }
            seen.get(value)!.push([row, col]);
          }
        }
      }

      for (const [, positions] of seen) {
        if (positions.length > 1) {
          positions.forEach(([row, col]) => conflicts.add(`${row}-${col}`));
        }
      }
    }
  }

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      cellAt(newBoard, row, col).isConflict = conflicts.has(`${row}-${col}`);
    }
  }

  return newBoard;
}

export function isBoardComplete(board: SudokuBoard): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = cellAt(board, row, col);
      if (cell.value === null || cell.isConflict) {
        return false;
      }
    }
  }
  return true;
}

export function validateKillerCages(board: SudokuBoard, cages: KillerCage[]): SudokuBoard {
  const newBoard = structuredClone(board);

  const boardWithBasicConflicts = checkConflicts(newBoard);

  for (const cage of cages) {
    let sum = 0;
    const usedNumbers = new Set<number>();
    let allFilled = true;
    let hasConflict = false;

    for (const [row, col] of cage.cells) {
      const value = cellAt(boardWithBasicConflicts, row, col).value;

      if (value === null) {
        allFilled = false;
        continue;
      }

      sum += value;

      if (usedNumbers.has(value)) {
        hasConflict = true;
      }
      usedNumbers.add(value);
    }

    if (allFilled && sum !== cage.sum) {
      hasConflict = true;
    }

    if (sum > cage.sum) {
      hasConflict = true;
    }

    if (hasConflict) {
      for (const [row, col] of cage.cells) {
        if (cellAt(boardWithBasicConflicts, row, col).value !== null) {
          cellAt(boardWithBasicConflicts, row, col).isConflict = true;
        }
      }
    }
  }

  return boardWithBasicConflicts;
}

export function isKillerBoardComplete(board: SudokuBoard, cages: KillerCage[]): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = cellAt(board, row, col);
      if (cell.value === null || cell.isConflict) {
        return false;
      }
    }
  }

  for (const cage of cages) {
    let sum = 0;
    const usedNumbers = new Set<number>();

    for (const [row, col] of cage.cells) {
      const value = cellAt(board, row, col).value!;
      sum += value;

      if (usedNumbers.has(value)) {
        return false;
      }
      usedNumbers.add(value);
    }

    if (sum !== cage.sum) {
      return false;
    }
  }

  return true;
}
