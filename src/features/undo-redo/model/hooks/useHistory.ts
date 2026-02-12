import { useHistoryStore } from "@features/undo-redo/model/stores/historyStore";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { useShallow } from "zustand/react/shallow";
import { useCallback } from "react";

export function useHistory() {
  const { board, countBoardNumbers } = useSudokuStore(
    useShallow((state) => ({
      board: state.board,
      countBoardNumbers: state.countBoardNumbers,
    })),
  );

  const {
    pushState, undo: undoHistory, redo: redoHistory,
    canUndo, canRedo, clear: clearHistory,
  } = useHistoryStore(
    useShallow((state) => ({
      pushState: state.pushState,
      undo: state.undo,
      redo: state.redo,
      canUndo: state.canUndo,
      canRedo: state.canRedo,
      clear: state.clear,
    })),
  );

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
