import { DIRECTIONS, STONE, WIN_LENGTH } from '@views/gomoku/config/board';
import { lineThrough } from '@views/gomoku/lib/boardLines';

export const findWinLine = (cells: ArrayLike<number>, cell: number): number[] | null => {
  if (cells[cell] === STONE.EMPTY) return null;
  for (const direction of DIRECTIONS) {
    const line = lineThrough(cells, cell, direction);
    const isWin = cells[cell] === STONE.BLACK ? line.length === WIN_LENGTH : line.length >= WIN_LENGTH;
    if (isWin) return line;
  }
  return null;
};
