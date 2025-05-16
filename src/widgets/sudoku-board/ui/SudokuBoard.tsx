"use client";

import { MEDIUM, useSudokuStore } from "@entities/sudoku/model";
import { SudokuCell } from "@entities/sudoku/ui/Cell";
import React, { useEffect } from "react";

export const SudokuBoard: React.FC = () => {
  const { board, initializeGame, selectCell } = useSudokuStore();

  useEffect(() => {
    const isEmpty = board.every((row) => row.every((cell) => cell.value === null && !cell.isInitial));

    if (isEmpty) {
      initializeGame(MEDIUM);
    }
  }, [board, initializeGame]);

  return (
    <table className="border-collapse border-2 border-slate-800 bg-white w-fit mx-auto shadow-lg">
      <tbody>
        {board.map((row, rowIndex) => (
          <tr key={`row-${rowIndex}`}>
            {row.map((cell, colIndex) => (
              <SudokuCell
                key={`${rowIndex}-${colIndex}`}
                cell={cell}
                row={rowIndex}
                col={colIndex}
                onSelect={selectCell}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SudokuBoard;
