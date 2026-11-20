import { BLOCKS_PER_ROW, BLOCK_SIZE, BOARD_SIZE } from '../config/board';
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

type CellPosition = [number, number];

function range(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

function buildUnits(): CellPosition[][] {
  const indices = range(BOARD_SIZE);
  const rows = indices.map((row) => indices.map((col): CellPosition => [row, col]));
  const cols = indices.map((col) => indices.map((row): CellPosition => [row, col]));
  const blocks = range(BLOCKS_PER_ROW).flatMap((blockRow) =>
    range(BLOCKS_PER_ROW).map((blockCol) =>
      range(BLOCK_SIZE * BLOCK_SIZE).map((offset): CellPosition => {
        const row = blockRow * BLOCK_SIZE + Math.floor(offset / BLOCK_SIZE);
        const col = blockCol * BLOCK_SIZE + (offset % BLOCK_SIZE);
        return [row, col];
      }),
    ),
  );
  return [...rows, ...cols, ...blocks];
}

const UNITS = buildUnits();

function collectDuplicates(board: SudokuBoard, unit: CellPosition[], conflicts: Set<string>): void {
  const seen = new Map<number, CellPosition[]>();
  for (const [row, col] of unit) {
    const value = cellAt(board, row, col).value;
    if (value === null) continue;
    seen.set(value, [...(seen.get(value) ?? []), [row, col]]);
  }
  for (const positions of seen.values()) {
    if (positions.length > 1) positions.forEach(([row, col]) => conflicts.add(`${row}-${col}`));
  }
}

export function checkConflicts(board: SudokuBoard): SudokuBoard {
  const newBoard = structuredClone(board);
  const conflicts = new Set<string>();

  for (const unit of UNITS) collectDuplicates(newBoard, unit, conflicts);

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

function cageHasConflict(board: SudokuBoard, cage: KillerCage): boolean {
  let sum = 0;
  let hasDuplicate = false;
  let allFilled = true;
  const usedNumbers = new Set<number>();

  for (const [row, col] of cage.cells) {
    const value = cellAt(board, row, col).value;
    if (value === null) {
      allFilled = false;
      continue;
    }
    sum += value;
    hasDuplicate ||= usedNumbers.has(value);
    usedNumbers.add(value);
  }

  const isSumMismatch = allFilled && sum !== cage.sum;
  return hasDuplicate || isSumMismatch || sum > cage.sum;
}

function markCageConflict(board: SudokuBoard, cage: KillerCage): void {
  for (const [row, col] of cage.cells) {
    const cell = cellAt(board, row, col);
    if (cell.value !== null) cell.isConflict = true;
  }
}

export function validateKillerCages(board: SudokuBoard, cages: KillerCage[]): SudokuBoard {
  const boardWithBasicConflicts = checkConflicts(structuredClone(board));

  for (const cage of cages) {
    if (cageHasConflict(boardWithBasicConflicts, cage)) markCageConflict(boardWithBasicConflicts, cage);
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
