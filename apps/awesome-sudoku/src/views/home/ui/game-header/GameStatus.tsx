'use client';
import { SelectSelector } from '@views/home/ui/sudoku-game/SelectSelector';
import { TimerControl } from '@views/home/ui/sudoku-game/TimerControl';
import type { FC } from 'react';

import { MistakeCounter } from '@views/home/ui/game-header/MistakeCounter';

export const GameStatus: FC = () => (
  <div className="w-full flex items-center justify-between">
    <SelectSelector />
    <MistakeCounter />
    <TimerControl />
  </div>
);
