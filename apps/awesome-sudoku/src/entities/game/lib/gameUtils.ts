import { BLOCK_SIZE, BOARD_SIZE, KEY_NUMBER } from '../model/constants/board';
import type { Grid } from '../model/types/board';
import { atIndex, cellAt } from './gridAccess';

export function isValidNumberSet(numbers: readonly number[]): boolean {
  if (numbers.length !== BOARD_SIZE) return false;
  const numberSet = new Set(numbers);
  return numberSet.size === BOARD_SIZE && KEY_NUMBER.every((n) => numberSet.has(n));
}

export function getRowNumbers(grid: Grid, row: number): number[] {
  return atIndex(grid, row);
}

export function getColumnNumbers(grid: Grid, col: number): number[] {
  return grid.map((row) => atIndex(row, col));
}

export function getBlockNumbers(grid: Grid, blockRow: number, blockCol: number): number[] {
  const block: number[] = [];
  const startRow = blockRow * BLOCK_SIZE;
  const startCol = blockCol * BLOCK_SIZE;

  for (let r = 0; r < BLOCK_SIZE; r++) {
    for (let c = 0; c < BLOCK_SIZE; c++) {
      block.push(cellAt(grid, startRow + r, startCol + c));
    }
  }

  return block;
}
