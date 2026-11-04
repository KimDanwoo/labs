import type { SudokuCell } from './board';

export interface HistoryEntry {
  board: SudokuCell[][];
  timestamp: number;
}
