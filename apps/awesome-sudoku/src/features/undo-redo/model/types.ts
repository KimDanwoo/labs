import { SudokuCell } from "@entities/board/model/types";

export interface HistoryEntry {
  board: SudokuCell[][];
  timestamp: number;
}

export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  maxSize: number;
}

export interface HistoryActions {
  pushState: (board: SudokuCell[][]) => void;
  undo: () => SudokuCell[][] | null;
  redo: () => SudokuCell[][] | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}
