import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { EMPTY_HIGHLIGHT } from '../../../config/board';
import { cageLabelCellsAtom } from '../../store/cageLabelAtoms';
import { gameModeAtom, highlightedCellsAtom, isNoteModeAtom, timerActiveAtom } from '../../store/primitives';
import { hasSelectedCellAtom } from '../../store/selectionAtoms';
import { type CellProps } from '../../types/board';
import { useCellAccessibility } from './useCellAccessibility';
import { useCellInteraction } from './useCellInteraction';
import { useCellStyles } from './useCellStyles';
import { useFocusWhenSelected } from './useFocusWhenSelected';

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
