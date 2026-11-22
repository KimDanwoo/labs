import { CELL_COUNT, DIRECTIONS, STONE, WIN_LENGTH } from '@views/gomoku/config/board';
import { cellAt, colOf, isInside, rowOf } from '@views/gomoku/lib/coords';
import type { Stone } from '@views/gomoku/model/types/gomoku';

interface MutableBoard {
  [cell: number]: number;
}

type Direction = (typeof DIRECTIONS)[number];

const FOUR = WIN_LENGTH - 1;
const DOUBLE = 2;

const reach = (cells: MutableBoard, from: number, rowStep: number, colStep: number) => {
  let row = rowOf(from) + rowStep;
  let col = colOf(from) + colStep;
  let count = 0;
  const isSameStone = (): boolean => isInside(row, col) && cells[cellAt(row, col)] === cells[from];
  while (isSameStone()) {
    count += 1;
    row += rowStep;
    col += colStep;
  }
  return { count, isOpen: isInside(row, col) && cells[cellAt(row, col)] === STONE.EMPTY };
};

const lineShape = (cells: MutableBoard, cell: number, [rowStep, colStep]: Direction) => {
  const back = reach(cells, cell, -rowStep, -colStep);
  const front = reach(cells, cell, rowStep, colStep);
  return { length: back.count + front.count + 1, isOpen: back.isOpen && front.isOpen };
};

const gapAt = (cells: MutableBoard, cell: number, [rowStep, colStep]: Direction, offset: number): number | null => {
  const row = rowOf(cell) + rowStep * offset;
  const col = colOf(cell) + colStep * offset;
  const isGap = offset !== 0 && isInside(row, col) && cells[cellAt(row, col)] === STONE.EMPTY;
  return isGap ? cellAt(row, col) : null;
};

const isOpenThree = (cells: MutableBoard, cell: number, direction: Direction): boolean => {
  let canOpenFour = false;
  for (let offset = -FOUR; offset <= FOUR; offset += 1) {
    const gap = gapAt(cells, cell, direction, offset);
    if (gap === null) continue;
    cells[gap] = cells[cell]!;
    const shape = lineShape(cells, cell, direction);
    cells[gap] = STONE.EMPTY;
    if (shape.length >= WIN_LENGTH) return false;
    const isOpenFour = shape.length === FOUR && shape.isOpen;
    canOpenFour ||= isOpenFour;
  }
  return canOpenFour;
};

export const isDoubleThree = (cells: MutableBoard, cell: number, stone: Stone): boolean => {
  cells[cell] = stone;
  const threes = DIRECTIONS.filter((direction) => isOpenThree(cells, cell, direction)).length;
  cells[cell] = STONE.EMPTY;
  return threes >= DOUBLE;
};

export const isForbidden = (cells: ArrayLike<number>, cell: number, stone: Stone): boolean => {
  const board = Array.from(cells);
  board[cell] = stone;
  const isFive = DIRECTIONS.some((direction) => lineShape(board, cell, direction).length >= WIN_LENGTH);
  return !isFive && isDoubleThree(board, cell, stone);
};

export const forbiddenCells = (cells: ArrayLike<number>, stone: Stone): Set<number> => {
  const found = new Set<number>();
  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    const isBanned = cells[cell] === STONE.EMPTY && isForbidden(cells, cell, stone);
    if (isBanned) found.add(cell);
  }
  return found;
};
