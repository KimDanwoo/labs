'use client';
import { cn } from '@shared/lib/cn';
import { useCell } from '@views/home/model/sudoku-game/hooks/useCell';
import { type CellProps } from '@views/home/model/types/board';
import { CellNotes } from '@views/home/ui/sudoku-game/CellNotes';
import { CellValue } from '@views/home/ui/sudoku-game/CellValue';
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
      {cell.value ? <CellValue value={cell.value} /> : <CellNotes notes={cell.notes} hasCageLabel={hasCageLabel} />}
    </td>
  );
});

SudokuCell.displayName = 'SudokuCell';
