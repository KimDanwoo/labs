'use client';
import { GameDifficultySelector, TimerControl } from '@features/sudoku-game';
import type { FC } from 'react';

import { MistakeCounter } from './MistakeCounter';

export const GameStatus: FC = () => (
  <div className="w-full flex items-center justify-between">
    <GameDifficultySelector.Select />
    <MistakeCounter />
    <TimerControl />
  </div>
);
