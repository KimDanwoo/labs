import { CELL_FOCUS_RING } from '@entities/sudoku/config/board';
import type { CellHighlight } from '@entities/sudoku/model/types/board';
import { cn } from '@shared/lib/cn';

export function getCellBorderStyles(row: number, col: number) {
  return {
    isRightBlockBorder: (col + 1) % 3 === 0 && col < 8,
    isBottomBlockBorder: (row + 1) % 3 === 0 && row < 8,
  };
}

export function getCellHighlightStyles(highlight: CellHighlight, isConflict: boolean, isHint: boolean) {
  return {
    bgColor: cn(
      'bg-surface-primary',
      highlight.related && 'bg-cell-related',
      highlight.sameValue && 'bg-cell-selected',
      highlight.selected && 'bg-cell-selected',
    ),
    textColor: cn(
      'text-text-primary',
      isHint && 'text-hint-text',
      isConflict && 'text-error-text animate-subtle-pulse',
    ),
    borderColor: 'border-border-light',
  };
}

export function buildCellClassName(
  { bgColor, textColor, borderColor }: ReturnType<typeof getCellHighlightStyles>,
  { isRightBlockBorder, isBottomBlockBorder }: ReturnType<typeof getCellBorderStyles>,
  isInitial: boolean,
) {
  return cn(
    'relative',
    'w-9 h-9',
    'xs:w-10 xs:h-10',
    'lg:w-12 lg:h-12',
    'xl:w-14 xl:h-14',
    'border',
    borderColor,
    'text-center align-middle',
    'cursor-pointer',
    'transition-all duration-150 ease-out',
    CELL_FOCUS_RING,
    'select-none',
    'touch-manipulation',
    bgColor,
    textColor,
    isInitial ? 'font-semibold' : 'font-normal',
    isRightBlockBorder && 'border-r-[1.5px] border-r-text-tertiary',
    isBottomBlockBorder && 'border-b-[1.5px] border-b-text-tertiary',
    'hover:bg-cell-related',
  );
}
