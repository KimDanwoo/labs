'use client';

import dynamic from 'next/dynamic';

import { SudokuBoard } from '@views/home/ui/game-board/SudokuBoard';
import { GameStatus } from '@views/home/ui/game-header/GameStatus';

const PauseGameOverlay = dynamic(() => import('@views/home/ui/game-overlays/PauseGameOverlay'), { ssr: false });
const GeneratingOverlay = dynamic(() => import('@views/home/ui/game-overlays/GeneratingOverlay'), { ssr: false });

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
