'use client';

import dynamic from 'next/dynamic';

import { GAME_MODE_TITLES } from '@entities/sudoku/config/gameMode';
import { useInitializeGame } from '@entities/sudoku/model/sudoku-game/hooks/useInitializeGame';
import type { GameMode } from '@entities/sudoku/model/types/game';

import { GameColumn } from '@entities/sudoku/ui/game-board/GameColumn';
import { DesktopControlPanel } from '@entities/sudoku/ui/game-controls/DesktopControlPanel';
import { MobileControlPanel } from '@entities/sudoku/ui/game-controls/MobileControlPanel';

const GameConfirmSheet = dynamic(
  () => import('@entities/sudoku/ui/game-confirm/GameConfirmSheet').then((m) => m.GameConfirmSheet),
  {
    ssr: false,
  },
);

const GameResultSheet = dynamic(
  () => import('@entities/sudoku/ui/game-result/GameResultSheet').then((m) => m.GameResultSheet),
  {
    ssr: false,
  },
);

interface SudokuScreenProps {
  mode: GameMode;
}

export function SudokuScreen({ mode }: SudokuScreenProps) {
  useInitializeGame(mode);

  return (
    <main className="min-w-[360px] relative overflow-x-hidden">
      <h1 className="sr-only">{GAME_MODE_TITLES[mode]}</h1>
      <div className="relative mx-auto px-4 sm:px-6 py-6 md:py-10">
        <div className="flex flex-col items-center lg:grid lg:grid-cols-[auto_auto] lg:justify-center lg:items-start lg:gap-12">
          <GameColumn />
          <DesktopControlPanel />
          <MobileControlPanel />
        </div>
      </div>
      <GameResultSheet />
      <GameConfirmSheet />
    </main>
  );
}
