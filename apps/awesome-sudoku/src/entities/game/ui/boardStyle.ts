import { cn } from '@shared/lib/cn';
import type { CellHighlight } from '../model/types/board';

export function getCellBorderStyles(row: number, col: number) {
  return {
    isRightBlockBorder: (col + 1) % 3 === 0 && col < 8,
    isBottomBlockBorder: (row + 1) % 3 === 0 && row < 8,
  };
}

export function getCellHighlightStyles(highlight: CellHighlight, isConflict: boolean, isHint: boolean) {
  return {
    bgColor: cn(
      'bg-[rgb(var(--color-surface-primary))]',
      highlight.related && 'bg-[rgb(var(--color-cell-related))]',
      highlight.sameValue && 'bg-[rgb(var(--color-cell-selected))]',
      highlight.selected && 'bg-[rgb(var(--color-cell-selected))]',
    ),
    textColor: cn(
      'text-[rgb(var(--color-text-primary))]',
      isHint && 'text-[rgb(var(--color-hint-text))]',
      isConflict && 'text-[rgb(var(--color-error-text))] animate-subtle-pulse',
    ),
    borderColor: 'border-[rgb(var(--color-border-light))]',
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
    'focus-visible:outline-none',
    'select-none',
    'touch-manipulation',
    bgColor,
    textColor,
    isInitial ? 'font-semibold' : 'font-normal',
    isRightBlockBorder && 'border-r-[1.5px] border-r-[rgb(var(--color-text-tertiary))]',
    isBottomBlockBorder && 'border-b-[1.5px] border-b-[rgb(var(--color-text-tertiary))]',
    'hover:bg-[rgb(var(--color-cell-related))]',
  );
}
