'use client';
import { boardAtom, GAME_MODE, gameModeAtom, selectCellAtom } from '@entities/game';
import { KillerCage, useInitializeGame, useKeyboardControls } from '@features/sudoku-game';
import { cn } from '@shared/model/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';

import { BoardRow } from './BoardRow';

export const SudokuBoard: React.FC = () => {
  const gameMode = useAtomValue(gameModeAtom);
  const board = useAtomValue(boardAtom);
  const selectCell = useSetAtom(selectCellAtom);

  useKeyboardControls();
  useInitializeGame();

  const handleSelectCell = useCallback((row: number, col: number) => selectCell({ row, col }), [selectCell]);

  return (
    <div className="relative group flex-shrink-0">
      {/* Outer glow */}
      <div
        className={cn(
          'absolute -inset-3 opacity-60 blur-2xl transition-opacity duration-500',
          'bg-gradient-to-br from-blue-400/20 via-indigo-400/10 to-purple-400/20',
          'dark:from-blue-500/10 dark:via-indigo-500/5 dark:to-purple-500/10',
          'group-hover:opacity-80',
        )}
      />

      {/* Board container */}
      <div
        className={cn(
          'relative bg-[rgb(var(--color-surface-primary))] overflow-hidden',
          'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]',
          'dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]',
          'ring-1 ring-black/[0.03] dark:ring-white/[0.05]',
        )}
      >
        {gameMode === GAME_MODE.KILLER && <KillerCage />}

        <table aria-label="스도쿠 보드" className="border-collapse bg-[rgb(var(--color-surface-primary))]">
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
