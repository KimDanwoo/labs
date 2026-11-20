'use client';
import { GAME_MODE } from '@entities/sudoku/config/game';
import { boardAtom, gameModeAtom } from '@entities/sudoku/model/store/primitives';
import { selectCellAtom } from '@entities/sudoku/model/store/selectionAtoms';
import { useKeyboardControls } from '@entities/sudoku/model/sudoku-game/hooks/useKeyboardControls';
import { KillerCage } from '@entities/sudoku/ui/sudoku-game/KillerCage';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useRef } from 'react';

import { BoardRow } from '@entities/sudoku/ui/game-board/BoardRow';

export const SudokuBoard: React.FC = () => {
  const gameMode = useAtomValue(gameModeAtom);
  const board = useAtomValue(boardAtom);
  const selectCell = useSetAtom(selectCellAtom);
  const tableRef = useRef<HTMLTableElement>(null);

  useKeyboardControls();

  const handleSelectCell = useCallback((row: number, col: number) => selectCell({ row, col }), [selectCell]);

  return (
    <div className="relative group shrink-0">
      <div className="absolute -inset-3 opacity-60 blur-2xl transition-opacity duration-500 bg-linear-to-br from-blue-400/20 via-indigo-400/10 to-purple-400/20 dark:from-blue-500/10 dark:via-indigo-500/5 dark:to-purple-500/10 group-hover:opacity-80" />

      <div className="relative bg-surface-primary overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-black/3 dark:ring-white/5">
        {gameMode === GAME_MODE.KILLER && <KillerCage tableRef={tableRef} />}

        <table ref={tableRef} role="grid" aria-label="스도쿠 보드" className="border-collapse bg-surface-primary">
          <tbody>
            {board.map((row, rowIndex) => (
              <BoardRow key={`row-${rowIndex}`} row={row} rowIndex={rowIndex} onSelect={handleSelectCell} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
