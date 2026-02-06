"use client";

import { SudokuCell as SudokuCellType } from "@entities/board/model/types";
import { GAME_MODE } from "@entities/game/model/constants";
import { useInitializeGame, useKeyboardControls } from "@features/sudoku-game/model/hooks";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { KillerCage, Cell as SudokuCell } from "@features/sudoku-game/ui";
import { memo, useCallback } from "react";

interface BoardRowProps {
  row: SudokuCellType[];
  rowIndex: number;
  onSelect: (row: number, col: number) => void;
}

const BoardRow = memo<BoardRowProps>(({ row, rowIndex, onSelect }) => (
  <tr>
    {row.map((cell, colIndex) => (
      <SudokuCell
        key={`${rowIndex}-${colIndex}`}
        cell={cell}
        row={rowIndex}
        col={colIndex}
        onSelect={onSelect}
      />
    ))}
  </tr>
));

BoardRow.displayName = "BoardRow";

export const SudokuBoard: React.FC = () => {
  const gameMode = useSudokuStore((state) => state.gameMode);
  const board = useSudokuStore((state) => state.board);
  const selectCell = useSudokuStore((state) => state.selectCell);

  useKeyboardControls();
  useInitializeGame();

  const handleSelectCell = useCallback(
    (row: number, col: number) => selectCell(row, col),
    [selectCell],
  );

  return (
    <div className="relative group flex-shrink-0">
      {/* Outer glow */}
      <div
        className={
          "absolute -inset-3 rounded-3xl opacity-60 blur-2xl transition-opacity duration-500 " +
          "bg-gradient-to-br from-blue-400/20 via-indigo-400/10 to-purple-400/20 " +
          "dark:from-blue-500/10 dark:via-indigo-500/5 dark:to-purple-500/10 " +
          "group-hover:opacity-80"
        }
      />

      {/* Board container */}
      <div
        className={
          "relative bg-[rgb(var(--color-surface-primary))] rounded-2xl overflow-hidden " +
          "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] " +
          "ring-1 ring-black/[0.03] dark:ring-white/[0.05]"
        }
      >
        {gameMode === GAME_MODE.KILLER && <KillerCage />}

        <table className="border-collapse bg-[rgb(var(--color-surface-primary))]">
          <tbody>
            {board.map((row, rowIndex) => (
              <BoardRow
                key={`row-${rowIndex}`}
                row={row}
                rowIndex={rowIndex}
                onSelect={handleSelectCell}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SudokuBoard;
