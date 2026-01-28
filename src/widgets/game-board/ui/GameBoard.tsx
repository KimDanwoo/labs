"use client";

import { GAME_MODE } from "@entities/game/model/constants";
import { Cell as SudokuCell, KillerCage } from "@features/sudoku-game/ui";
import { useInitializeGame, useKeyboardControls } from "@features/sudoku-game/model/hooks";
import { useSudokuStore } from "@features/sudoku-game/model/stores";

export const SudokuBoard: React.FC = () => {
  const gameMode = useSudokuStore((state) => state.gameMode);
  const board = useSudokuStore((state) => state.board);
  const selectCell = useSudokuStore((state) => state.selectCell);

  useKeyboardControls();
  useInitializeGame();

  return (
    <div className="relative">
      {/* Subtle outer glow */}
      <div className="absolute -inset-1 bg-gradient-to-b from-white/50 to-transparent rounded-2xl blur-sm" />

      {/* Main board container */}
      <div className="relative bg-white rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        {gameMode === GAME_MODE.KILLER && <KillerCage />}

        <table className="border-collapse bg-white">
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
    </div>
  );
};

export default SudokuBoard;
