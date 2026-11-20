import { BOARD_MAX_INDEX, BOARD_SIZE } from '@views/home/config/board';
import { GAME_MODE } from '@views/home/config/game';
import type { Position, SudokuCell } from '@views/home/model/types/board';
import type { GameMode } from '@views/home/model/types/game';

interface SavedGame {
  board: unknown;
  solution: unknown;
  gameMode: GameMode;
  cages: unknown;
}

const isDigit = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= BOARD_SIZE;

const isCell = (cell: unknown): cell is SudokuCell =>
  typeof cell === 'object' &&
  cell !== null &&
  'value' in cell &&
  'isInitial' in cell &&
  'notes' in cell &&
  (cell.value === null || isDigit(cell.value)) &&
  typeof cell.isInitial === 'boolean' &&
  Array.isArray(cell.notes);

const isGridOf = <T>(grid: unknown, isItem: (item: unknown) => item is T): grid is T[][] =>
  Array.isArray(grid) &&
  grid.length === BOARD_SIZE &&
  grid.every((row) => Array.isArray(row) && row.length === BOARD_SIZE && row.every(isItem));

const isBoardIndex = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= BOARD_MAX_INDEX;

export const isBoardPosition = (position: unknown): position is Position =>
  typeof position === 'object' &&
  position !== null &&
  'row' in position &&
  'col' in position &&
  isBoardIndex(position.row) &&
  isBoardIndex(position.col);

export function isRestorableGame({ board, solution, gameMode, cages }: SavedGame): boolean {
  if (!isGridOf(board, isCell) || !isGridOf(solution, isDigit)) return false;
  if (!Array.isArray(cages)) return false;
  const isKillerBoard = cages.length > 0;
  if (isKillerBoard !== (gameMode === GAME_MODE.KILLER)) return false;

  return board.every((row, rowIndex) =>
    row.every((cell, colIndex) => !cell.isInitial || cell.value === solution[rowIndex]?.[colIndex]),
  );
}
