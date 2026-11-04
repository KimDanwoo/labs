'use client';
import type { SudokuCell as SudokuCellType } from '@entities/game/model/types';
import { Cell as SudokuCell } from '@features/sudoku-game/ui';
import { memo } from 'react';

interface BoardRowProps {
  row: SudokuCellType[];
  rowIndex: number;
  onSelect: (row: number, col: number) => void;
}
export const BoardRow = memo<BoardRowProps>(({ row, rowIndex, onSelect }) => (
  <tr>
    {row.map((cell, colIndex) => (
      <SudokuCell key={`${rowIndex}-${colIndex}`} cell={cell} row={rowIndex} col={colIndex} onSelect={onSelect} />
    ))}
  </tr>
));

BoardRow.displayName = 'BoardRow';
