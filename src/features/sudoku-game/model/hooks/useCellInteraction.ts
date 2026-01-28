import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { KeyboardEvent, useCallback } from "react";

interface UseCellInteractionProps {
  row: number;
  col: number;
  onSelect: (row: number, col: number) => void;
  timerActive: boolean;
}

export const useCellInteraction = ({ row, col, onSelect, timerActive }: UseCellInteractionProps) => {
  const handleClick = useCallback(() => {
    if (timerActive) {
      onSelect(row, col);
    }
  }, [onSelect, row, col, timerActive]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableCellElement>) => {
      if (!timerActive) return;

      const keyPressed = event.key;

      if (keyPressed === "Enter" || keyPressed === " ") {
        event.preventDefault();
        onSelect(row, col);
      }

      if (/^[1-9]$/.test(keyPressed)) {
        event.preventDefault();
        onSelect(row, col);
        setTimeout(() => {
          const store = useSudokuStore.getState();
          store.handleKeyInput(keyPressed);
        }, 0);
      }

      if (keyPressed === "Backspace" || keyPressed === "Delete") {
        event.preventDefault();
        onSelect(row, col);
        setTimeout(() => {
          const store = useSudokuStore.getState();
          store.handleKeyInput(keyPressed);
        }, 0);
      }
    },
    [timerActive, onSelect, row, col],
  );

  return {
    handleClick,
    handleKeyDown,
  };
};
