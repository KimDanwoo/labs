import { CELL_COUNT, DIRECTIONS, NEAR_RADIUS, WIN_LENGTH } from '@views/gomoku/config/board';
import { cellAt, colOf, isInside, rowOf } from '@views/gomoku/lib/coords';

const range = (length: number): number[] => Array.from({ length }, (_, index) => index);

const windowFrom = (cell: number, rowStep: number, colStep: number): number[][] => {
  const row = rowOf(cell);
  const col = colOf(cell);
  const last = WIN_LENGTH - 1;
  if (!isInside(row + rowStep * last, col + colStep * last)) return [];
  return [range(WIN_LENGTH).map((step) => cellAt(row + rowStep * step, col + colStep * step))];
};

const isNear = (cell: number, other: number): boolean =>
  cell !== other &&
  Math.abs(rowOf(cell) - rowOf(other)) <= NEAR_RADIUS &&
  Math.abs(colOf(cell) - colOf(other)) <= NEAR_RADIUS;

export const WINDOWS: readonly (readonly number[])[] = range(CELL_COUNT).flatMap((cell) =>
  DIRECTIONS.flatMap(([rowStep, colStep]) => windowFrom(cell, rowStep, colStep)),
);

export const WINDOWS_AT: readonly (readonly number[])[] = range(CELL_COUNT).map((cell) =>
  range(WINDOWS.length).filter((window) => WINDOWS[window]?.includes(cell)),
);

export const NEAR: readonly (readonly number[])[] = range(CELL_COUNT).map((cell) =>
  range(CELL_COUNT).filter((other) => isNear(cell, other)),
);
