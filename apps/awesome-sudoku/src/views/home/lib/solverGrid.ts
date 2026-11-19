import { BLOCK_SIZE, BOARD_SIZE, SUDOKU_CELL_COUNT } from '../config/board';
import { createEmptyGrid } from '../model/services/common';
import type { Grid } from '../model/types/board';

/** 후보는 비트마스크로 다룬다: 숫자 d ↔ 비트 (1 << d). 0번 비트는 쓰지 않는다. */
export const ALL_DIGITS = 0b1111111110;
export const EMPTY = 0;
export const bit = (digit: number): number => 1 << digit;
export const popcount = (mask: number): number => {
  let count = 0;
  for (let m = mask; m !== 0; m &= m - 1) count++;
  return count;
};
export const digitsOf = (mask: number): number[] => {
  const digits: number[] = [];
  for (let d = 1; d <= BOARD_SIZE; d++) if (mask & bit(d)) digits.push(d);
  return digits;
};
export const rowOf = (index: number): number => Math.floor(index / BOARD_SIZE);
export const colOf = (index: number): number => index % BOARD_SIZE;
export const boxOf = (index: number): number =>
  Math.floor(rowOf(index) / BLOCK_SIZE) * BLOCK_SIZE + Math.floor(colOf(index) / BLOCK_SIZE);
export const UNITS: number[][] = (() => {
  const rows = Array.from({ length: BOARD_SIZE }, (_, r) =>
    Array.from({ length: BOARD_SIZE }, (_, c) => r * BOARD_SIZE + c),
  );
  const cols = Array.from({ length: BOARD_SIZE }, (_, c) =>
    Array.from({ length: BOARD_SIZE }, (_, r) => r * BOARD_SIZE + c),
  );
  const boxes = Array.from({ length: BOARD_SIZE }, (_, b) => {
    const baseRow = Math.floor(b / BLOCK_SIZE) * BLOCK_SIZE;
    const baseCol = (b % BLOCK_SIZE) * BLOCK_SIZE;
    return Array.from(
      { length: BOARD_SIZE },
      (_, i) => (baseRow + Math.floor(i / BLOCK_SIZE)) * BOARD_SIZE + baseCol + (i % BLOCK_SIZE),
    );
  });
  return [...rows, ...cols, ...boxes];
})();
export const ROW_UNITS = UNITS.slice(0, BOARD_SIZE);
export const COL_UNITS = UNITS.slice(BOARD_SIZE, BOARD_SIZE * 2);
export const BOX_UNITS = UNITS.slice(BOARD_SIZE * 2);
export const PEERS: number[][] = Array.from({ length: SUDOKU_CELL_COUNT }, (_, i) => {
  const peers = new Set<number>();
  for (const unit of [ROW_UNITS[rowOf(i)]!, COL_UNITS[colOf(i)]!, BOX_UNITS[boxOf(i)]!])
    unit.forEach((p) => peers.add(p));
  peers.delete(i);
  return [...peers];
});
export const flatten = (grid: Grid): number[] => grid.flat();
export const unflatten = (cells: number[]): Grid => {
  const grid = createEmptyGrid();
  cells.forEach((v, i) => {
    grid[rowOf(i)]![colOf(i)] = v;
  });
  return grid;
};
export function* combinations<T>(items: T[], size: number, start = 0, acc: T[] = []): Generator<T[]> {
  if (acc.length === size) {
    yield acc;
    return;
  }
  for (let i = start; i <= items.length - (size - acc.length); i++) {
    yield* combinations(items, size, i + 1, [...acc, items[i]!]);
  }
}
