'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

import { useInitializeGame } from '@entities/sudoku/model/sudoku-game/hooks/useInitializeGame';
import type { GameMode } from '@entities/sudoku/model/types/game';
import { GameColumn } from '@entities/sudoku/ui/game-board/GameColumn';
import { Controls } from '@entities/sudoku/ui/game-controls/Controls';
import { GameStatus } from '@entities/sudoku/ui/game-header/GameStatus';
import { SudokuRule } from '@entities/sudoku/ui/game-rule/SudokuRule';
import { SelectNumber } from '@entities/sudoku/ui/sudoku-game/SelectNumber';
import { GameLayout } from '@shared/ui/game-layout';

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
  children: ReactNode;
}

export function SudokuScreen({ mode, children }: SudokuScreenProps) {
  useInitializeGame(mode);

  return (
    <>
      <GameLayout.Root>
        {children}
        <GameLayout.Status>
          <GameStatus />
        </GameLayout.Status>
        <GameLayout.Board>
          <GameColumn />
        </GameLayout.Board>
        <GameLayout.Panel>
          <Controls />
          <SelectNumber />
          <SudokuRule />
        </GameLayout.Panel>
      </GameLayout.Root>
      <GameResultSheet />
      <GameConfirmSheet />
    </>
  );
}
