"use client";

import { GAME_MODE } from "@entities/sudoku/model/constants";
import { useInitializeGame, useKeyboardControls } from "@entities/sudoku/model/hooks";
import { useSudokuStore } from "@entities/sudoku/model/stores";
import { SudokuCell } from "@entities/sudoku/ui/Cell";
import { CompleteSudoku } from "@features/complete-sudoku/CompleteSudoku";
import { KillerCage } from "@features/killer-cage/ui/KillerCage";
import { PauseOverlay } from "@features/pause-overlay/PauseOverlay";

export const SudokuBoard: React.FC = () => {
  const selectCell = useSudokuStore((state) => state.selectCell);
  const gameMode = useSudokuStore((state) => state.gameMode);
  const board = useSudokuStore((state) => state.board);

  useKeyboardControls();
  useInitializeGame();

  return (
    <div className="relative">
      <CompleteSudoku />

      <PauseOverlay />

      {gameMode === GAME_MODE.KILLER && <KillerCage />}

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
