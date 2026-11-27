'use client';
import { BOARD_SIZE, KEY_NUMBER } from '@entities/sudoku/config/board';
import { cellAt } from '@entities/sudoku/lib/gridAccess';
import { fillCellAtom, toggleNoteAtom } from '@entities/sudoku/model/store/cellValueAtoms';
import {
  boardAtom,
  isNoteModeAtom,
  numberCountsAtom,
  selectedCellAtom,
  timerActiveAtom,
} from '@entities/sudoku/model/store/primitives';
import { NumberButton } from '@entities/sudoku/ui/sudoku-game/NumberButton';
import { useAtomValue, useSetAtom } from 'jotai';
import { type FC, useCallback, useMemo } from 'react';

export const SelectNumber: FC = () => {
  const isNoteMode = useAtomValue(isNoteModeAtom);
  const numberCounts = useAtomValue(numberCountsAtom);
  const timerActive = useAtomValue(timerActiveAtom);
  const board = useAtomValue(boardAtom);
  const selectedCell = useAtomValue(selectedCellAtom);
  const fillCell = useSetAtom(fillCellAtom);
  const toggleNote = useSetAtom(toggleNoteAtom);

  const isNumberDisabled = useMemo(() => (value: number) => (numberCounts[value] ?? 0) >= BOARD_SIZE, [numberCounts]);

  const handleNoteToggle = useCallback(
    (value: number) => {
      if (!selectedCell) return;

      const cell = cellAt(board, selectedCell.row, selectedCell.col);
      if (cell.isInitial) return;

      if (isNoteMode) {
        toggleNote(value);
        return;
      }
      fillCell(value);
    },
    [isNoteMode, fillCell, toggleNote, board, selectedCell],
  );

  return (
    <div className="grid grid-cols-9 gap-1.5 lg:grid-cols-3 lg:gap-2">
      {KEY_NUMBER.map((num) => (
        <NumberButton
          key={num}
          value={num}
          onClick={() => handleNoteToggle(num)}
          isDisabled={isNumberDisabled(num) || !timerActive}
        />
      ))}
    </div>
  );
};

export default SelectNumber;
