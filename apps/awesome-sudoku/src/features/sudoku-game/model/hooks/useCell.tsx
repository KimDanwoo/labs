import { CellProps } from '@entities/board/model/types';
import { gameModeAtom, highlightedCellsAtom, isNoteModeAtom, timerActiveAtom } from '@features/sudoku-game/model/atoms';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useCellAccessibility } from './useCellAccessibility';
import { useCellInteraction } from './useCellInteraction';
import { useCellStyles } from './useCellStyles';

const EMPTY_HIGHLIGHT = { selected: false, related: false, sameValue: false } as const;

export const useCell = ({ cell, row, col, onSelect }: CellProps) => {
  const cellKey = `${row}-${col}`;

  const gameMode = useAtomValue(gameModeAtom);
  const isNoteMode = useAtomValue(isNoteModeAtom);
  const timerActive = useAtomValue(timerActiveAtom);
  const highlightedCells = useAtomValue(highlightedCellsAtom);
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
