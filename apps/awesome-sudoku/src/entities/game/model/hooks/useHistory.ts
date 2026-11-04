import {
  boardAtom,
  canRedoAtom,
  canUndoAtom,
  clearHistoryAtom,
  countBoardNumbersAtom,
  pushStateAtom,
  redoAtom,
  undoAtom,
} from '@entities/game/model/store';
import { gameStore } from '@shared/model/store';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';

export function useHistory() {
  const board = useAtomValue(boardAtom);
  const countBoardNumbers = useSetAtom(countBoardNumbersAtom);

  const pushState = useSetAtom(pushStateAtom);
  const undoHistory = useSetAtom(undoAtom);
  const redoHistory = useSetAtom(redoAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const clearHistory = useSetAtom(clearHistoryAtom);

  const saveState = useCallback(() => {
    pushState(board);
  }, [board, pushState]);

  const undo = useCallback(() => {
    const previousBoard = undoHistory();
    if (previousBoard) {
      gameStore.set(boardAtom, previousBoard);
      countBoardNumbers();
    }
  }, [undoHistory, countBoardNumbers]);

  const redo = useCallback(() => {
    const nextBoard = redoHistory();
    if (nextBoard) {
      gameStore.set(boardAtom, nextBoard);
      countBoardNumbers();
    }
  }, [redoHistory, countBoardNumbers]);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
}
