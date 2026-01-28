"use client";

import { KEY_NUMBER } from "@entities/board/model/constants";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { NumberButton } from "@shared/ui";
import { FC, useCallback, useMemo } from "react";

export const SelectNumber: FC = () => {
  const isNoteMode = useSudokuStore((state) => state.isNoteMode);
  const numberCounts = useSudokuStore((state) => state.numberCounts);
  const timerActive = useSudokuStore((state) => state.timerActive);

  const fillCell = useSudokuStore((state) => state.fillCell);
  const toggleNote = useSudokuStore((state) => state.toggleNote);

  const isNumberDisabled = useMemo(() => (value: number) => numberCounts[value] >= 9, [numberCounts]);

  const handleNoteToggle = useCallback(
    (value: number) => {
      if (isNoteMode) {
        toggleNote(value);
        return;
      }
      fillCell(value);
    },
    [isNoteMode, fillCell, toggleNote],
  );

  return (
    <div className="grid grid-cols-5 gap-3 lg:grid-cols-3">
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
