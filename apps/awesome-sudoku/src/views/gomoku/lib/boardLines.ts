import { STONE } from '@views/gomoku/config/board';
import { cellAt, colOf, isInside, rowOf } from '@views/gomoku/lib/coords';

export type Direction = readonly [number, number];

export const offsetCell = (cell: number, [rowStep, colStep]: Direction, offset: number): number | null => {
  const row = rowOf(cell) + rowStep * offset;
  const col = colOf(cell) + colStep * offset;
  return isInside(row, col) ? cellAt(row, col) : null;
};

const ray = (cells: ArrayLike<number>, from: number, direction: Direction): number[] => {
  const found: number[] = [];
  let next = offsetCell(from, direction, 1);
  const isSameStone = (): boolean => next !== null && cells[next] === cells[from];
  while (isSameStone()) {
    if (next === null) break;
    found.push(next);
    next = offsetCell(next, direction, 1);
  }
  return found;
};

export const lineThrough = (cells: ArrayLike<number>, cell: number, direction: Direction): number[] => {
  if (cells[cell] === STONE.EMPTY) return [];
  const reverse: Direction = [-direction[0], -direction[1]];
  return [...ray(cells, cell, reverse).reverse(), cell, ...ray(cells, cell, direction)];
};
