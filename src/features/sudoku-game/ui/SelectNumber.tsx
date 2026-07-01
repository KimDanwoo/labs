"use client";

import { BOARD_SIZE, KEY_NUMBER } from "@entities/board/model/constants";
import {
  isNoteModeAtom, numberCountsAtom, timerActiveAtom,
  boardAtom, selectedCellAtom, fillCellAtom, toggleNoteAtom,
} from "@features/sudoku-game/model/atoms";
import { pushStateAtom } from "@features/undo-redo/model/atoms";
import { cn } from "@shared/model/utils";
import { NumberButton } from "@shared/ui";
import { useAtomValue, useSetAtom } from "jotai";
import { FC, useCallback, useMemo } from "react";

export const SelectNumber: FC = () => {
  const isNoteMode = useAtomValue(isNoteModeAtom);
  const numberCounts = useAtomValue(numberCountsAtom);
  const timerActive = useAtomValue(timerActiveAtom);
  const board = useAtomValue(boardAtom);
  const selectedCell = useAtomValue(selectedCellAtom);
  const fillCell = useSetAtom(fillCellAtom);
  const toggleNote = useSetAtom(toggleNoteAtom);
  const pushState = useSetAtom(pushStateAtom);

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
