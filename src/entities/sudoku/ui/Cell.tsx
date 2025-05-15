'use client';

import React from 'react';
import { SudokuCell as SudokuCellType } from '../model/types';

interface CellProps {
  cell: SudokuCellType;
  row: number;
  col: number;
  onSelect: (row: number, col: number) => void;
}

export const SudokuCell: React.FC<CellProps> = ({ cell, row, col, onSelect }) => {
  const handleClick = () => {
    onSelect(row, col);
  };

  // 테두리 스타일링을 위한 조건
  const isRightBorder = (col + 1) % 3 === 0 && col < 8;
  const isBottomBorder = (row + 1) % 3 === 0 && row < 8;

  // 셀 크기 조정 반응형으로 조정
  return (
    <div
      className={`
        relative flex items-center justify-center
        w-15 h-15 border border-gray-300 cursor-pointer
        ${isRightBorder ? 'border-r-2 border-r-gray-700' : ''}
        ${isBottomBorder ? 'border-b-2 border-b-gray-700' : ''}
        ${cell.isSelected ? 'bg-blue-200' : ''}
        ${cell.isConflict ? 'text-red-600' : ''}
        ${cell.isInitial ? 'font-bold' : 'font-normal'}
        transition-colors duration-150
      `}
      onClick={handleClick}
    >
      {cell.value ? (
        <span className="text-xl">{cell.value}</span>
      ) : (
        <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <div key={num} className="flex items-center justify-center">
              {cell.notes.includes(num) && (
                <span className="text-xs text-gray-500">{num}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};