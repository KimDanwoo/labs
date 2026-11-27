'use client';

import dynamic from 'next/dynamic';

import { SudokuBoard } from '@entities/sudoku/ui/game-board/SudokuBoard';
import { GAME_BOARD_SIZE } from '@shared/config/gameLayout';
import { cn } from '@shared/lib/cn';

const PauseGameOverlay = dynamic(() => import('@entities/sudoku/ui/game-overlays/PauseGameOverlay'), { ssr: false });
const GeneratingOverlay = dynamic(() => import('@entities/sudoku/ui/game-overlays/GeneratingOverlay'), { ssr: false });

export function GameColumn() {
  return (
    <div className={cn('relative overflow-hidden rounded-[20px]', GAME_BOARD_SIZE)}>
      <PauseGameOverlay />
      <GeneratingOverlay />
      <SudokuBoard />
    </div>
  );
}
