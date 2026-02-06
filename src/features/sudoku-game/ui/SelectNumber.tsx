"use client";

import { KEY_NUMBER } from "@entities/board/model/constants";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { useHistoryStore } from "@features/undo-redo/model/stores/historyStore";
import { NumberButton } from "@shared/ui";
import { FC, useCallback, useMemo } from "react";

export const SelectNumber: FC = () => {
  const isNoteMode = useSudokuStore((state) => state.isNoteMode);
  const numberCounts = useSudokuStore((state) => state.numberCounts);
  const timerActive = useSudokuStore((state) => state.timerActive);
  const board = useSudokuStore((state) => state.board);
  const selectedCell = useSudokuStore((state) => state.selectedCell);

  const fillCell = useSudokuStore((state) => state.fillCell);
  const toggleNote = useSudokuStore((state) => state.toggleNote);
  const pushState = useHistoryStore((state) => state.pushState);

  const isNumberDisabled = useMemo(() => (value: number) => numberCounts[value] >= 9, [numberCounts]);

  const handleNoteToggle = useCallback(
    (value: number) => {
      if (!selectedCell) return;

      const cell = board[selectedCell.row][selectedCell.col];
      if (cell.isInitial) return;

      pushState(board);

      if (isNoteMode) {
        toggleNote(value);
        return;
      }
      fillCell(value);
    },
    [isNoteMode, fillCell, toggleNote, board, selectedCell, pushState],
  );

  return (
    <div
      className={
        "grid grid-cols-9 md:grid-cols-3 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 " +
        "h-full place-content-center place-items-center"
      }
    >
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
