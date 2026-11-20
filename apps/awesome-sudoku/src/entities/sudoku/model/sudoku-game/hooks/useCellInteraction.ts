import { handleKeyInputAtom } from '@entities/sudoku/model/store/keyboardAtoms';
import { useSetAtom } from 'jotai';
import { type KeyboardEvent, useCallback } from 'react';

interface UseCellInteractionProps {
  row: number;
  col: number;
  onSelect: (row: number, col: number) => void;
  timerActive: boolean;
}

export const useCellInteraction = ({ row, col, onSelect, timerActive }: UseCellInteractionProps) => {
  const handleKeyInput = useSetAtom(handleKeyInputAtom);

  const handleClick = useCallback(() => {
    if (timerActive) {
      onSelect(row, col);
    }
  }, [onSelect, row, col, timerActive]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableCellElement>) => {
      if (!timerActive) return;

      const keyPressed = event.key;

      const isSelectKey = keyPressed === 'Enter' || keyPressed === ' ';
      const isEraseKey = keyPressed === 'Backspace' || keyPressed === 'Delete';

      if (isSelectKey) {
        event.preventDefault();
        onSelect(row, col);
      }

      if (/^[1-9]$/.test(keyPressed)) {
        event.preventDefault();
        event.stopPropagation();
        onSelect(row, col);
        setTimeout(() => {
          handleKeyInput(keyPressed);
        }, 0);
      }

      if (isEraseKey) {
        event.preventDefault();
        event.stopPropagation();
        onSelect(row, col);
        setTimeout(() => {
          handleKeyInput(keyPressed);
        }, 0);
      }
    },
    [timerActive, onSelect, row, col, handleKeyInput],
  );

  return {
    handleClick,
    handleKeyDown,
  };
};
