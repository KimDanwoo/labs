import { CELL_COUNT, DIRECTIONS, STONE, WIN_LENGTH } from '@views/gomoku/config/board';
import { lineThrough, offsetCell, type Direction } from '@views/gomoku/lib/boardLines';
import { colOf, rowOf } from '@views/gomoku/lib/coords';
import { WINDOWS, WINDOWS_AT } from '@views/gomoku/lib/lines';
import type { Stone } from '@views/gomoku/model/types/gomoku';

const FOUR = WIN_LENGTH - 1;
const DOUBLE = 2;

const AXES = Array.from({ length: CELL_COUNT }, (_, cell) =>
  DIRECTIONS.map((direction) =>
    [-4, -3, -2, -1, 1, 2, 3, 4].map((n) => offsetCell(cell, direction, n)).filter((p): p is number => p !== null),
  ),
);

const fourCount = (cells: number[], cell: number): number => {
  const fours = new Set<string>();
  for (const index of WINDOWS_AT[cell] ?? []) {
    const window = WINDOWS[index]!;
    const own = window.filter((point) => cells[point] === STONE.BLACK);
    const gap = window.find((point) => cells[point] === STONE.EMPTY);
    const canComplete = own.length === FOUR && gap !== undefined;
    if (!canComplete) continue;
    const first = window[0]!;
    const second = window[1]!;
    const direction: Direction = [rowOf(second) - rowOf(first), colOf(second) - colOf(first)];
    cells[gap] = STONE.BLACK;
    const isFive = lineThrough(cells, gap, direction).length === WIN_LENGTH;
    cells[gap] = STONE.EMPTY;
    if (isFive) fours.add(own.join(','));
  }
  return fours.size;
};

const isOpenEnd = (cells: number[], end: number, direction: Direction): boolean => {
  const gap = offsetCell(end, direction, 1);
  if (gap === null) return false;
  if (cells[gap] !== STONE.EMPTY) return false;
  const beyond = offsetCell(gap, direction, 1);
  return beyond === null || cells[beyond] !== STONE.BLACK;
};

const isStraightFour = (cells: number[], line: number[], direction: Direction): boolean => {
  if (line.length !== FOUR) return false;
  const reverse: Direction = [-direction[0], -direction[1]];
  return isOpenEnd(cells, line[0]!, reverse) && isOpenEnd(cells, line[FOUR - 1]!, direction);
};

const hasFive = (cells: number[], cell: number): boolean =>
  DIRECTIONS.some((direction) => lineThrough(cells, cell, direction).length === WIN_LENGTH);

const canExtendThree = (cells: number[], cell: number, direction: Direction): boolean => {
  for (let offset = -FOUR; offset <= FOUR; offset += 1) {
    const gap = offsetCell(cell, direction, offset);
    const canPlace = gap !== null && cells[gap] === STONE.EMPTY;
    if (!canPlace) continue;
    cells[gap] = STONE.BLACK;
    const line = lineThrough(cells, cell, direction);
    const hasStraightFour = line.includes(gap) && isStraightFour(cells, line, direction);
    const canExtend = hasStraightFour && !hasFive(cells, gap) && !isForbiddenBlack(cells, gap);
    cells[gap] = STONE.EMPTY;
    if (canExtend) return true;
  }
  return false;
};

function isForbiddenBlack(cells: number[], cell: number): boolean {
  if (hasFive(cells, cell)) return false;
  const hasOverline = DIRECTIONS.some((direction) => lineThrough(cells, cell, direction).length > WIN_LENGTH);
  if (hasOverline) return true;
  if (fourCount(cells, cell) >= DOUBLE) return true;
  let threes = 0;
  for (const direction of DIRECTIONS) {
    if (canExtendThree(cells, cell, direction)) threes += 1;
    if (threes >= DOUBLE) return true;
  }
  return false;
}

export const isForbidden = (cells: ArrayLike<number>, cell: number, stone: Stone): boolean => {
  if (stone === STONE.WHITE) return false;
  let axes = 0;
  let crowded = false;
  for (const axis of AXES[cell]!) {
    let neighbors = 0;
    for (const other of axis) if (cells[other] === STONE.BLACK) neighbors++;
    if (neighbors >= 4) {
      crowded = true;
      break;
    }
    if (neighbors >= 2) axes++;
  }
  if (!crowded && axes < 2) return false;
  const board = Array.from(cells);

  board[cell] = stone;
  return isForbiddenBlack(board, cell);
};

export const forbiddenCells = (cells: ArrayLike<number>, stone: Stone): Set<number> => {
  const found = new Set<number>();
  if (stone === STONE.WHITE) return found;
  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    const isBanned = cells[cell] === STONE.EMPTY && isForbidden(cells, cell, stone);
    if (isBanned) found.add(cell);
  }
  return found;
};
