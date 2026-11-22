import { CELL_COUNT, STONE } from '@views/gomoku/config/board';
import { FORBIDDEN_LABEL, STONE_LABEL } from '@views/gomoku/config/stone';
import { colOf, rowOf, stoneAtPly } from '@views/gomoku/lib/coords';
import type { Cell } from '@views/gomoku/model/types/gomoku';

export const cellsOf = (moves: readonly number[]): Cell[] => {
  const cells = new Array<Cell>(CELL_COUNT).fill(STONE.EMPTY);
  moves.forEach((cell, ply) => {
    cells[cell] = stoneAtPly(ply);
  });
  return cells;
};

export const cellLabel = (cell: number, stone: Cell, isForbidden: boolean): string =>
  `${rowOf(cell) + 1}행 ${colOf(cell) + 1}열 ${isForbidden ? FORBIDDEN_LABEL : STONE_LABEL[stone]}`;
