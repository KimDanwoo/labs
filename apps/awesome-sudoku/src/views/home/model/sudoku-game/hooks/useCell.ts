import { EMPTY_HIGHLIGHT } from '@views/home/config/board';
import { cageLabelCellsAtom } from '@views/home/model/store/cageLabelAtoms';
import {
  gameModeAtom,
  highlightedCellsAtom,
  isNoteModeAtom,
  timerActiveAtom,
} from '@views/home/model/store/primitives';
import { hasSelectedCellAtom } from '@views/home/model/store/selectionAtoms';
import { useCellAccessibility } from '@views/home/model/sudoku-game/hooks/useCellAccessibility';
import { useCellInteraction } from '@views/home/model/sudoku-game/hooks/useCellInteraction';
import { useCellStyles } from '@views/home/model/sudoku-game/hooks/useCellStyles';
import { useFocusWhenSelected } from '@views/home/model/sudoku-game/hooks/useFocusWhenSelected';
import { type CellProps } from '@views/home/model/types/board';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

export const useCell = ({ cell, row, col, onSelect }: CellProps) => {
  const cellKey = `${row}-${col}`;

  const gameMode = useAtomValue(gameModeAtom);
  const isNoteMode = useAtomValue(isNoteModeAtom);
  const timerActive = useAtomValue(timerActiveAtom);
  const hasSelection = useAtomValue(hasSelectedCellAtom);
  const highlightedCells = useAtomValue(highlightedCellsAtom);
  const hasCageLabel = useAtomValue(cageLabelCellsAtom).has(cellKey);
  const highlight = useMemo(() => highlightedCells[cellKey] ?? EMPTY_HIGHLIGHT, [highlightedCells, cellKey]);

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
    hasSelection,
  });

  const { handleClick, handleKeyDown } = useCellInteraction({
    row,
    col,
    onSelect,
    timerActive,
  });

  const cellRef = useFocusWhenSelected(cell.isSelected);

  return {
    cellRef,
    className,
    ariaLabel,
    ariaDescription,
    handleClick,
    handleKeyDown,
    tabIndex,
    stateClasses,
    hasCageLabel,
  };
};
