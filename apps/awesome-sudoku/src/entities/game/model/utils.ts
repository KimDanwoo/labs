import { BLOCK_SIZE, BOARD_SIZE, KEY_NUMBER } from "@entities/board/model/constants";
import { Grid } from "@entities/board/model/types";

/**
 * 숫자 세트가 유효한지 확인
 * @param numbers - 숫자 세트
 * @returns 유효한 숫자 세트 여부
 */
export function isValidNumberSet(numbers: readonly number[]): boolean {
  if (numbers.length !== BOARD_SIZE) return false;
  const numberSet = new Set(numbers);
  return numberSet.size === BOARD_SIZE && KEY_NUMBER.every((n) => numberSet.has(n));
}

/**
 * @description 행의 숫자 배열을 반환
 * @param {Grid} grid - 그리드
 * @param {number} row - 행
 * @returns {number[]} 행의 숫자 배열
 */
export function getRowNumbers(grid: Grid, row: number): number[] {
  return grid[row];
}

/**
 * @description 열의 숫자 배열을 반환
 * @param {Grid} grid - 그리드
 * @param {number} col - 열
 * @returns {number[]} 열의 숫자 배열
 */
export function getColumnNumbers(grid: Grid, col: number): number[] {
  return grid.map((row) => row[col]);
}

/**
 * @description 블록의 숫자 배열을 반환
 * @param {Grid} grid - 그리드
 * @param {number} blockRow - 블록 행
 * @param {number} blockCol - 블록 열
 * @returns {number[]} 블록의 숫자 배열
 */
export function getBlockNumbers(grid: Grid, blockRow: number, blockCol: number): number[] {
  const block: number[] = [];
  const startRow = blockRow * BLOCK_SIZE;
  const startCol = blockCol * BLOCK_SIZE;

  for (let r = 0; r < BLOCK_SIZE; r++) {
    for (let c = 0; c < BLOCK_SIZE; c++) {
      block.push(grid[startRow + r][startCol + c]);
    }
  }

  return block;
}
