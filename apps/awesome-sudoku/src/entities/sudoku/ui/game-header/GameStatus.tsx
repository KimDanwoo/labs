'use client';
import { SelectSelector } from '@entities/sudoku/ui/sudoku-game/SelectSelector';
import { TimerControl } from '@entities/sudoku/ui/sudoku-game/TimerControl';
import type { FC } from 'react';

import { MistakeCounter } from '@entities/sudoku/ui/game-header/MistakeCounter';

export const GameStatus: FC = () => (
  <div className="w-full flex items-center justify-between">
    <SelectSelector />
    <MistakeCounter />
    <TimerControl />
  </div>
);
