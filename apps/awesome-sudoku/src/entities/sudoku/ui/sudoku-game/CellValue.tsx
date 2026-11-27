import { memo } from 'react';

import { CELL_VALUE_BELOW_CAGE_LABEL, CELL_VALUE_TEXT } from '@entities/sudoku/config/board';
import { cn } from '@shared/lib/cn';

interface CellValueProps {
  value: number;
  hasCageLabel: boolean;
}

export const CellValue = memo(function CellValue({ value, hasCageLabel }: CellValueProps) {
  return (
    <span className={cn(CELL_VALUE_TEXT, 'font-tabular', hasCageLabel && CELL_VALUE_BELOW_CAGE_LABEL)}>{value}</span>
  );
});

CellValue.displayName = 'CellValue';
