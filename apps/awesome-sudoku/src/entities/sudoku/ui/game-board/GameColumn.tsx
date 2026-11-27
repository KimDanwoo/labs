'use client';

import dynamic from 'next/dynamic';

import { BOARD_COLUMN } from '@entities/sudoku/config/board';
import { SudokuBoard } from '@entities/sudoku/ui/game-board/SudokuBoard';
import { GAME_BOARD_SIZE } from '@shared/config/gameLayout';
import { cn } from '@shared/lib/cn';

const PauseGameOverlay = dynamic(() => import('@entities/sudoku/ui/game-overlays/PauseGameOverlay'), { ssr: false });
const GeneratingOverlay = dynamic(() => import('@entities/sudoku/ui/game-overlays/GeneratingOverlay'), { ssr: false });

export function GameColumn() {
  return (
    <div className={cn(BOARD_COLUMN, GAME_BOARD_SIZE)}>
      <PauseGameOverlay />
      <GeneratingOverlay />
      <SudokuBoard />
    </div>
  );
}
