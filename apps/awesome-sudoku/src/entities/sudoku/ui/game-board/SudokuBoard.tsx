'use client';
import { BOARD_FRAME, BOARD_TABLE } from '@entities/sudoku/config/board';
import { GAME_MODE } from '@entities/sudoku/config/game';
import { boardAtom, gameModeAtom } from '@entities/sudoku/model/store/primitives';
import { selectCellAtom } from '@entities/sudoku/model/store/selectionAtoms';
import { useKeyboardControls } from '@entities/sudoku/model/sudoku-game/hooks/useKeyboardControls';
import { KillerCage } from '@entities/sudoku/ui/sudoku-game/KillerCage';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useRef } from 'react';

import { BoardRow } from '@entities/sudoku/ui/game-board/BoardRow';

export function SudokuBoard() {
  const gameMode = useAtomValue(gameModeAtom);
  const board = useAtomValue(boardAtom);
  const selectCell = useSetAtom(selectCellAtom);
  const tableRef = useRef<HTMLTableElement>(null);
  const isKiller = gameMode === GAME_MODE.KILLER;

  useKeyboardControls();

  const handleSelectCell = useCallback((row: number, col: number) => selectCell({ row, col }), [selectCell]);

  return (
    <div className={BOARD_FRAME}>
      {isKiller && <KillerCage tableRef={tableRef} />}

      <table ref={tableRef} role="grid" aria-label="스도쿠 보드" className={BOARD_TABLE}>
        <tbody>
          {board.map((row, rowIndex) => (
            <BoardRow key={`row-${rowIndex}`} row={row} rowIndex={rowIndex} onSelect={handleSelectCell} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
