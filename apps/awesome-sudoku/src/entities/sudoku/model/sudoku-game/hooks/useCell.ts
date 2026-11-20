import { EMPTY_HIGHLIGHT } from '@entities/sudoku/config/board';
import { cageLabelCellsAtom } from '@entities/sudoku/model/store/cageLabelAtoms';
import {
  gameModeAtom,
  highlightedCellsAtom,
  isNoteModeAtom,
  timerActiveAtom,
} from '@entities/sudoku/model/store/primitives';
import { hasSelectedCellAtom } from '@entities/sudoku/model/store/selectionAtoms';
import { useCellAccessibility } from '@entities/sudoku/model/sudoku-game/hooks/useCellAccessibility';
import { useCellInteraction } from '@entities/sudoku/model/sudoku-game/hooks/useCellInteraction';
import { useCellStyles } from '@entities/sudoku/model/sudoku-game/hooks/useCellStyles';
import { useFocusWhenSelected } from '@entities/sudoku/model/sudoku-game/hooks/useFocusWhenSelected';
import { type CellProps } from '@entities/sudoku/model/types/board';
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
