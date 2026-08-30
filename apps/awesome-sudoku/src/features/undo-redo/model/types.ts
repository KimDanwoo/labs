import type { SudokuCell } from '@entities/board/model/types';

export interface HistoryEntry {
  board: SudokuCell[][];
  timestamp: number;
}
