import { SudokuCell } from "@entities/board/model/types";
import { HistoryActions, HistoryEntry, HistoryState } from "@features/undo-redo/model/types";
import { create } from "zustand";

const MAX_HISTORY_SIZE = 50;

export const useHistoryStore = create<HistoryState & HistoryActions>((set, get) => ({
  past: [],
  future: [],
  maxSize: MAX_HISTORY_SIZE,

  /**
   * 보드 스냅샷을 히스토리에 추가한다.
   * 보드 상태는 불변(immutable)이므로 참조를 직접 저장해도 안전하다.
   * (모든 store action이 spread로 새 객체를 생성함)
   */
  pushState: (board: SudokuCell[][]) => {
    const entry: HistoryEntry = {
      board,
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

    return entry.board;
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return null;

    const newFuture = [...future];
    const entry = newFuture.shift();
    if (!entry) return null;

    set({ future: newFuture });

    return entry.board;
  },

  canUndo: () => get().past.length > 0,

  canRedo: () => get().future.length > 0,

  clear: () => {
    set({ past: [], future: [] });
  },
}));
