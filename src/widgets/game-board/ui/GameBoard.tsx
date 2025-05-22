"use client";

import { SudokuCell } from "@entities/cell/ui/Cell";
import { GAME_MODE } from "@entities/game/model/constants";
import { useInitializeGame, useKeyboardControls } from "@entities/sudoku/model/hooks";
import { useSudokuStore } from "@entities/sudoku/model/stores";
import { KillerCage } from "@features/killer-cage/ui/KillerCage";

export const SudokuBoard: React.FC = () => {
  const selectCell = useSudokuStore((state) => state.selectCell);
  const gameMode = useSudokuStore((state) => state.gameMode);
  const board = useSudokuStore((state) => state.board);

  useKeyboardControls();
  useInitializeGame();

  return (
    <>
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
    </>
  );
};

export default SudokuBoard;
