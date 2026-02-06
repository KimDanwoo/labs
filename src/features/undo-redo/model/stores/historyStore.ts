import { SudokuCell } from "@entities/board/model/types";
import { HistoryActions, HistoryEntry, HistoryState } from "@features/undo-redo/model/types";
import { create } from "zustand";

const MAX_HISTORY_SIZE = 50;

function cloneBoard(board: SudokuCell[][]): SudokuCell[][] {
  return board.map((row) =>
    row.map((cell) => ({
      ...cell,
      notes: [...cell.notes],
    })),
  );
}

export const useHistoryStore = create<HistoryState & HistoryActions>((set, get) => ({
  past: [],
  future: [],
  maxSize: MAX_HISTORY_SIZE,

  pushState: (board: SudokuCell[][]) => {
    const entry: HistoryEntry = {
      board: cloneBoard(board),
      timestamp: Date.now(),
    };

    set((state) => {
      const newPast = [...state.past, entry];
      if (newPast.length > state.maxSize) {
        newPast.shift();
      }

      return {
        past: newPast,
        future: [],
      };
    });
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return null;

    const newPast = [...past];
    const entry = newPast.pop();
    if (!entry) return null;

    set({ past: newPast });

    return cloneBoard(entry.board);
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return null;

    const newFuture = [...future];
    const entry = newFuture.shift();
    if (!entry) return null;

    set({ future: newFuture });

    return cloneBoard(entry.board);
  },

  canUndo: () => get().past.length > 0,

  canRedo: () => get().future.length > 0,

  clear: () => {
    set({ past: [], future: [] });
  },
}));
