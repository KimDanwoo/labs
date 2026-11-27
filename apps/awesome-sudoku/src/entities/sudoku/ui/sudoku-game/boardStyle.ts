import { BLOCK_LINE, CELL_FOCUS_RING, CELL_SIZE } from '@entities/sudoku/config/board';
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
    'relative p-0',
    CELL_SIZE,
    'border',
    borderColor,
    'text-center align-middle',
    'cursor-pointer',
    'transition-[background-color,color] duration-150 ease-out motion-reduce:transition-none',
    CELL_FOCUS_RING,
    'select-none',
    'touch-manipulation',
    bgColor,
    textColor,
    isInitial ? 'font-semibold' : 'font-normal',
    isRightBlockBorder && BLOCK_LINE.right,
    isBottomBlockBorder && BLOCK_LINE.bottom,
    'hover:bg-cell-related',
  );
}
