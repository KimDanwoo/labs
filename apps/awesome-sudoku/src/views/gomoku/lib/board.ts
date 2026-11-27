import { CELL_COUNT, STONE } from '@views/gomoku/config/board';
import {
  EMPTY_STONE_CLASS,
  FORBIDDEN_LABEL,
  PLACED_STONE_CLASS,
  STONE_CLASS,
  STONE_LABEL,
} from '@views/gomoku/config/stone';
import { colOf, rowOf, stoneAtPly } from '@views/gomoku/lib/coords';
import type { Cell, Stone } from '@views/gomoku/model/types/gomoku';

export const stoneClassOf = (stone: Cell, playerStone: Stone): string => {
  if (stone !== STONE.EMPTY) return `${STONE_CLASS[stone]} ${PLACED_STONE_CLASS}`;
  return `${STONE_CLASS[playerStone]} ${EMPTY_STONE_CLASS}`;
};

export const cellsOf = (moves: readonly number[]): Cell[] => {
  const cells = new Array<Cell>(CELL_COUNT).fill(STONE.EMPTY);
  moves.forEach((cell, ply) => {
    cells[cell] = stoneAtPly(ply);
  });
  return cells;
};

export const cellLabel = (cell: number, stone: Cell, isForbidden: boolean): string =>
  `${rowOf(cell) + 1}행 ${colOf(cell) + 1}열 ${isForbidden ? FORBIDDEN_LABEL : STONE_LABEL[stone]}`;
