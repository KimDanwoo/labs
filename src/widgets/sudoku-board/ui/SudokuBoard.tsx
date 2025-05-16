"use client";

import { useSudokuStore } from "@entities/sudoku/model/store";
import { SudokuCell } from "@entities/sudoku/ui/Cell";
import React, { useEffect } from "react";

export const SudokuBoard: React.FC = () => {
  const { board, initializeGame, selectCell } = useSudokuStore();

  useEffect(() => {
    const isEmpty = board.every((row) => row.every((cell) => cell.value === null && !cell.isInitial));

    if (isEmpty) {
      initializeGame("medium");
    }
  }, [board, initializeGame]);

  return (
    <div className="grid grid-cols-9 border-2 border-gray-800 bg-white w-fit mx-auto shadow-lg">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <SudokuCell key={`${rowIndex}-${colIndex}`} cell={cell} row={rowIndex} col={colIndex} onSelect={selectCell} />
        )),
      )}
    </div>
  );
};

export default SudokuBoard;
