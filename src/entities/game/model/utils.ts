import { BLOCK_SIZE, BOARD_SIZE, KEY_NUMBER } from "@entities/board/model/constants";
import { Grid } from "@entities/board/model/types";

export const isValidNumberSet = (numbers: readonly number[]): boolean => {
  if (numbers.length !== BOARD_SIZE) return false;
  const numberSet = new Set(numbers);
  return numberSet.size === BOARD_SIZE && KEY_NUMBER.every((n) => numberSet.has(n));
};

export const getRowNumbers = (grid: Grid, row: number): number[] => grid[row];

export const getColumnNumbers = (grid: Grid, col: number): number[] => grid.map((row) => row[col]);

export const getBlockNumbers = (grid: Grid, blockRow: number, blockCol: number): number[] => {
  const block: number[] = [];
  const startRow = blockRow * BLOCK_SIZE;
  const startCol = blockCol * BLOCK_SIZE;

  for (let r = 0; r < BLOCK_SIZE; r++) {
    for (let c = 0; c < BLOCK_SIZE; c++) {
      block.push(grid[startRow + r][startCol + c]);
    }
  }

  return block;
};
