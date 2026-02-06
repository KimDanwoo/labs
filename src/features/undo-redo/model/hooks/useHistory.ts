import { useHistoryStore } from "@features/undo-redo/model/stores/historyStore";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { useCallback } from "react";

export function useHistory() {
  const board = useSudokuStore((state) => state.board);
  const countBoardNumbers = useSudokuStore((state) => state.countBoardNumbers);

  const pushState = useHistoryStore((state) => state.pushState);
  const undoHistory = useHistoryStore((state) => state.undo);
  const redoHistory = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo);
  const canRedo = useHistoryStore((state) => state.canRedo);
  const clearHistory = useHistoryStore((state) => state.clear);

  const saveState = useCallback(() => {
    pushState(board);
  }, [board, pushState]);

  const undo = useCallback(() => {
    const previousBoard = undoHistory();
    if (previousBoard) {
      useSudokuStore.setState({ board: previousBoard });
      countBoardNumbers();
    }
  }, [undoHistory, countBoardNumbers]);

  const redo = useCallback(() => {
    const nextBoard = redoHistory();
    if (nextBoard) {
      useSudokuStore.setState({ board: nextBoard });
      countBoardNumbers();
    }
  }, [redoHistory, countBoardNumbers]);

  return {
    saveState,
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    clearHistory,
  };
}
