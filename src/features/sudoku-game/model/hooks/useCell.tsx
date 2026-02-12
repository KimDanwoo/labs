import { CellProps } from "@entities/board/model/types";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { useShallow } from "zustand/react/shallow";
import { useCellStyles } from "./useCellStyles";
import { useCellAccessibility } from "./useCellAccessibility";
import { useCellInteraction } from "./useCellInteraction";

const EMPTY_HIGHLIGHT = { selected: false, related: false, sameValue: false } as const;

export const useCell = ({ cell, row, col, onSelect }: CellProps) => {
  const cellKey = `${row}-${col}`;

  const { gameMode, isNoteMode, timerActive, highlight } = useSudokuStore(
    useShallow((state) => ({
      gameMode: state.gameMode,
      isNoteMode: state.isNoteMode,
      timerActive: state.timerActive,
      highlight: state.highlightedCells[cellKey] ?? EMPTY_HIGHLIGHT,
    })),
  );

  const { className, stateClasses } = useCellStyles({
    cell,
    row,
    col,
    highlight,
    timerActive,
  });

  const { ariaLabel, ariaDescription, tabIndex } = useCellAccessibility({
    cell,
    row,
    col,
    gameMode,
    isNoteMode,
    timerActive,
  });

  const { handleClick, handleKeyDown } = useCellInteraction({
    row,
    col,
    onSelect,
    timerActive,
  });

  return {
    className,
    ariaLabel,
    ariaDescription,
    handleClick,
    handleKeyDown,
    tabIndex,
    stateClasses,
  };
};
