'use client';
import { useAtomValue, useSetAtom } from 'jotai';
import { type FC, useCallback, useMemo } from 'react';
import { BOARD_SIZE, KEY_NUMBER } from '../../config/board';
import { cellAt } from '../../lib/gridAccess';
import { fillCellAtom, toggleNoteAtom } from '../../model/store/cellValueAtoms';
import {
  boardAtom,
  isNoteModeAtom,
  numberCountsAtom,
  selectedCellAtom,
  timerActiveAtom,
} from '../../model/store/primitives';
import { NumberButton } from './NumberButton';

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
    <div className="grid grid-cols-9 md:grid-cols-3 gap-1.5 xs:gap-2 md:gap-2.5 lg:gap-3 h-full place-content-center place-items-center">
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
