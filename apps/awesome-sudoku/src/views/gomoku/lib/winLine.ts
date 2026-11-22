import { DIRECTIONS, STONE, WIN_LENGTH } from '@views/gomoku/config/board';
import { cellAt, colOf, isInside, rowOf } from '@views/gomoku/lib/coords';

const ray = (cells: ArrayLike<number>, from: number, rowStep: number, colStep: number): number[] => {
  const run: number[] = [];
  let row = rowOf(from) + rowStep;
  let col = colOf(from) + colStep;
  const isSameStone = (): boolean => isInside(row, col) && cells[cellAt(row, col)] === cells[from];
  while (isSameStone()) {
    run.push(cellAt(row, col));
    row += rowStep;
    col += colStep;
  }
  return run;
};

export const findWinLine = (cells: ArrayLike<number>, cell: number): number[] | null => {
  if (cells[cell] === STONE.EMPTY) return null;
  for (const [rowStep, colStep] of DIRECTIONS) {
    const line = [...ray(cells, cell, -rowStep, -colStep), cell, ...ray(cells, cell, rowStep, colStep)];
    if (line.length >= WIN_LENGTH) return line;
  }
  return null;
};
