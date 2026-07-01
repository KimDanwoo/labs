import { BLOCK_SIZE, BOARD_CENTER, BOARD_MAX_INDEX } from "./constants";
import { Grid } from "./types";

/**
 * 그리드를 깊은 복사하여 반환
 * @param grid - 복사할 그리드
 * @returns 복사된 그리드
 */
export function deepCopyGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

/**
 * 블록 좌표를 반환
 * @param row - 행
 * @param col - 열
 * @returns 블록 좌표
 */
export function getBlockCoordinates(row: number, col: number): [number, number] {
  return [Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE, Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE];
}

/**
 * 중앙 거리를 반환
 * @param row - 행
 * @param col - 열
 * @returns 중앙 거리
 */
export function getCenterDistance(row: number, col: number): number {
  return Math.abs(BOARD_CENTER - row) + Math.abs(BOARD_CENTER - col);
}

/**
 * 코너 여부를 반환
 * @param row - 행
 * @param col - 열
 * @returns 코너 여부
 */
export function isCorner(row: number, col: number): boolean {
  return (row === 0 || row === BOARD_MAX_INDEX) && (col === 0 || col === BOARD_MAX_INDEX);
}

/**
 * 가장자리 여부를 반환
 * @param row - 행
 * @param col - 열
 * @returns 가장자리 여부
 */
export function isEdge(row: number, col: number): boolean {
  return row === 0 || row === BOARD_MAX_INDEX || col === 0 || col === BOARD_MAX_INDEX;
}

/**
 * 중앙 여부를 반환
 * @param row - 행
 * @param col - 열
 * @returns 중앙 여부
 */
export function isCenter(row: number, col: number): boolean {
  return getCenterDistance(row, col) <= 2;
}
