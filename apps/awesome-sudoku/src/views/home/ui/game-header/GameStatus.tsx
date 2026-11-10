'use client';
import type { FC } from 'react';
import { GameDifficultySelector } from '../sudoku-game/GameDifficultySelector';
import { TimerControl } from '../sudoku-game/TimerControl';

import { MistakeCounter } from './MistakeCounter';

export const GameStatus: FC = () => (
  <div className="w-full flex items-center justify-between">
    <GameDifficultySelector.Select />
    <MistakeCounter />
    <TimerControl />
  </div>
);
