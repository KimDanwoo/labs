import { handleKeyInputAtom, selectedCellAtom } from '@entities/game';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

export const useKeyboardControls = () => {
  const handleKeyInput = useSetAtom(handleKeyInputAtom);
  const selectedCell = useAtomValue(selectedCellAtom);

  useEffect(() => {
    if (!selectedCell) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      const validKeys = [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Backspace',
        'Delete',
      ];

      if (validKeys.includes(event.key)) {
        event.preventDefault();

        handleKeyInput(event.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCell, handleKeyInput]);
};
