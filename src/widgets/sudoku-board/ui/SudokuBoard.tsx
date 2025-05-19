"use client";

import { KILLER_MODE, MEDIUM, useKeyboardControls, useSudokuStore } from "@entities/sudoku/model";
import { SudokuCell } from "@entities/sudoku/ui/Cell";
import { KillerCage } from "@features/killer-cage/ui/KillerCage";
import { PauseOverlay } from "@features/pause-overlay/PauseOverlay";
import React, { useEffect } from "react";

export const SudokuBoard: React.FC = () => {
  const board = useSudokuStore((state) => state.board);
  const initializeGame = useSudokuStore((state) => state.initializeGame);
  const selectCell = useSudokuStore((state) => state.selectCell);
  const gameMode = useSudokuStore((state) => state.gameMode);
  useKeyboardControls();

  useEffect(() => {
    const isEmpty = board.every((row) => row.every((cell) => cell.value === null && !cell.isInitial));

    if (isEmpty) {
      initializeGame(MEDIUM);
    }
  }, [board, initializeGame]);

  return (
    <div className="relative">
      <PauseOverlay />

      {gameMode === KILLER_MODE && <KillerCage />}

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
    </div>
  );
};

export default SudokuBoard;
