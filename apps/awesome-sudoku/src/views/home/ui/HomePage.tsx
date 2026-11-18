'use client';

import dynamic from 'next/dynamic';

import { BackgroundGlow } from './BackgroundGlow';
import { SudokuBoard } from './game-board/SudokuBoard';
import { Controls } from './game-controls/Controls';
import { DesktopControlPanel } from './game-controls/DesktopControlPanel';
import { GameStatus } from './game-header/GameStatus';
import { GameModeSelector } from './sudoku-game/GameModeSelector';
import { SelectNumber } from './sudoku-game/SelectNumber';
import { ThemeToggle } from './ThemeToggle';

const PauseGameOverlay = dynamic(() => import('./game-overlays/PauseGameOverlay'), { ssr: false });
const GeneratingOverlay = dynamic(() => import('./game-overlays/GeneratingOverlay'), { ssr: false });
const GameResultSheet = dynamic(() => import('./game-result/GameResultSheet').then((m) => m.GameResultSheet), {
  ssr: false,
});

export const HomePage = () => (
  <main className="min-h-svh min-w-[360px] bg-surface-secondary relative overflow-x-hidden">
    <BackgroundGlow />

    <header className="glass-header">
      <div className="mx-auto py-3 flex items-center justify-between w-full max-w-[360px] lg:max-w-[912px] xl:max-w-[1056px]">
        <GameModeSelector />
        <ThemeToggle />
      </div>
    </header>

    <div className="relative mx-auto px-4 sm:px-6 py-6 md:py-10">
      <div className="flex flex-col items-center lg:grid lg:grid-cols-[auto_auto] lg:justify-center lg:items-start lg:gap-12">
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

        <DesktopControlPanel />

        <div className="lg:hidden w-full mt-6 space-y-3 max-w-[360px]">
          <Controls />
          <SelectNumber />
        </div>
      </div>
    </div>

    <GameResultSheet />
  </main>
);
