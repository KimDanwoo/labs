'use client';
import { useCell } from '@entities/sudoku/model/sudoku-game/hooks/useCell';
import { type CellProps } from '@entities/sudoku/model/types/board';
import { CellNotes } from '@entities/sudoku/ui/sudoku-game/CellNotes';
import { CellValue } from '@entities/sudoku/ui/sudoku-game/CellValue';
import { cn } from '@shared/lib/cn';
import { type FC, memo } from 'react';

export const SudokuCell: FC<CellProps> = memo((props) => {
  const { cell } = props;
  const {
    cellRef,
    className,
    ariaLabel,
    ariaDescription,
    handleClick,
    handleKeyDown,
    tabIndex,
    stateClasses,
    hasCageLabel,
  } = useCell(props);

  return (
    <td
      ref={cellRef}
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
        boxShadow: 'none',
      }}
    >
      {cell.value ? (
        <CellValue value={cell.value} hasCageLabel={hasCageLabel} />
      ) : (
        <CellNotes notes={cell.notes} hasCageLabel={hasCageLabel} />
      )}
    </td>
  );
});

SudokuCell.displayName = 'SudokuCell';
