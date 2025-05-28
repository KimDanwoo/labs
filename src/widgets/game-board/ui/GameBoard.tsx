"use client";

import { GAME_MODE } from "@entities/game/model/constants";
import { SudokuCell } from "@features/game-board/ui";
import { useInitializeGame, useKeyboardControls } from "@features/game-controls/model/hooks";
import { useSudokuStore } from "@features/game-controls/model/stores";
import { KillerCage } from "@features/killer-board/ui";

export const SudokuBoard: React.FC = () => {
  const gameMode = useSudokuStore((state) => state.gameMode);
  const board = useSudokuStore((state) => state.board);
  const selectCell = useSudokuStore((state) => state.selectCell);

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
