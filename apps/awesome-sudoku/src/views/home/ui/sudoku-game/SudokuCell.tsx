'use client';
import { type CellProps, CellNotes, CellValue } from '@entities/game';
import { cn } from '@shared/lib/cn';
import { type FC, memo } from 'react';
import { useCell } from '../../model/sudoku-game/hooks/useCell';

export const SudokuCell: FC<CellProps> = memo((props) => {
  const { cell } = props;
  const { className, ariaLabel, ariaDescription, handleClick, handleKeyDown, tabIndex, stateClasses } = useCell(props);

  return (
    <td
      className={cn(className, stateClasses)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex}
      role="gridcell"
      aria-label={ariaDescription ? `${ariaLabel}, ${ariaDescription}` : ariaLabel}
      aria-selected={cell.isSelected}
      aria-invalid={cell.isConflict}
      aria-readonly={cell.isInitial}
      draggable={false}
      style={{
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
        boxShadow: 'none',
      }}
    >
      {cell.value ? <CellValue value={cell.value} /> : <CellNotes notes={cell.notes} />}
    </td>
  );
});

SudokuCell.displayName = 'SudokuCell';
