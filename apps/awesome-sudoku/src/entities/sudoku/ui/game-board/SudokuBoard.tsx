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
    <div className="group flex aspect-square w-full items-center justify-center rounded-[20px] bg-face p-1.5">
      <div className="relative border-[1.5px] border-text-tertiary bg-surface-primary">
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
