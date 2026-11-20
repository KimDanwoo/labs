import type { SudokuBoard } from '../types/board';

export const hasPlayerProgress = (board: SudokuBoard): boolean =>
  board.some((row) => row.some((cell) => !cell.isInitial && (cell.value !== null || cell.notes.length > 0)));
