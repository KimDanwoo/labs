'use client';

import React, { useEffect } from 'react';
import { SudokuCell } from '@entities/sudoku/ui/Cell';
import { useSudokuStore } from '@entities/sudoku/model/store';

export const SudokuBoard: React.FC = () => {
  const { board, initializeGame, selectCell } = useSudokuStore();

  // 컴포넌트 마운트 시 게임 초기화 (보드가 비어있는 경우에만)
  useEffect(() => {
    const isEmpty = board.every(row => 
      row.every(cell => cell.value === null && !cell.isInitial)
    );
    
    if (isEmpty) {
      initializeGame('medium');
    }
  }, [board, initializeGame]);

  return (
    <div className="grid grid-cols-9 border-2 border-gray-800 bg-white w-fit mx-auto shadow-lg">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <SudokuCell
            key={`${rowIndex}-${colIndex}`}
            cell={cell}
            row={rowIndex}
            col={colIndex}
            onSelect={selectCell}
          />
        ))
      )}
    </div>
  );
};

export default SudokuBoard;