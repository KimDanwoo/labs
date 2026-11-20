'use client';

import dynamic from 'next/dynamic';

import { SudokuBoard } from '@entities/sudoku/ui/game-board/SudokuBoard';
import { GameStatus } from '@entities/sudoku/ui/game-header/GameStatus';

const PauseGameOverlay = dynamic(() => import('@entities/sudoku/ui/game-overlays/PauseGameOverlay'), { ssr: false });
const GeneratingOverlay = dynamic(() => import('@entities/sudoku/ui/game-overlays/GeneratingOverlay'), { ssr: false });

export function GameColumn() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full mb-4">
        <GameStatus />
      </div>
      <div className="relative">
        <PauseGameOverlay />
        <GeneratingOverlay />
        <SudokuBoard />
      </div>
    </div>
  );
}
