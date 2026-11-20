'use client';
import type { SudokuCell as SudokuCellType } from '@entities/sudoku/model/types/board';
import { SudokuCell } from '@entities/sudoku/ui/sudoku-game/SudokuCell';
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
