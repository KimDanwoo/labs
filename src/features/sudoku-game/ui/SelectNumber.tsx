"use client";

import { BOARD_SIZE, KEY_NUMBER } from "@entities/board/model/constants";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { useHistoryStore } from "@features/undo-redo/model/stores/historyStore";
import { cn } from "@shared/model/utils";
import { NumberButton } from "@shared/ui";
import { useShallow } from "zustand/react/shallow";
import { FC, useCallback, useMemo } from "react";

export const SelectNumber: FC = () => {
  const {
    isNoteMode, numberCounts, timerActive,
    board, selectedCell, fillCell, toggleNote,
  } = useSudokuStore(
    useShallow((state) => ({
      isNoteMode: state.isNoteMode,
      numberCounts: state.numberCounts,
      timerActive: state.timerActive,
      board: state.board,
      selectedCell: state.selectedCell,
      fillCell: state.fillCell,
      toggleNote: state.toggleNote,
    })),
  );
  const pushState = useHistoryStore((state) => state.pushState);

  const isNumberDisabled = useMemo(() => (value: number) => numberCounts[value] >= BOARD_SIZE, [numberCounts]);

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
      className={cn(
        "grid grid-cols-9 md:grid-cols-3 gap-1.5 xs:gap-2 md:gap-2.5 lg:gap-3",
        "h-full place-content-center place-items-center",
      )}
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
