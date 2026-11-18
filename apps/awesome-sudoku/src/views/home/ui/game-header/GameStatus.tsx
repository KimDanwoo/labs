'use client';
import type { FC } from 'react';
import { SelectSelector } from '../sudoku-game/SelectSelector';
import { TimerControl } from '../sudoku-game/TimerControl';

import { MistakeCounter } from './MistakeCounter';

export const GameStatus: FC = () => (
  <div className="w-full flex items-center justify-between">
    <SelectSelector />
    <MistakeCounter />
    <TimerControl />
  </div>
);
