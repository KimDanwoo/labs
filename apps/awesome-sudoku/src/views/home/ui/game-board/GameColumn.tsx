'use client';

import dynamic from 'next/dynamic';

import { GameStatus } from '../game-header/GameStatus';
import { SudokuBoard } from './SudokuBoard';

const PauseGameOverlay = dynamic(() => import('../game-overlays/PauseGameOverlay'), { ssr: false });
const GeneratingOverlay = dynamic(() => import('../game-overlays/GeneratingOverlay'), { ssr: false });

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
