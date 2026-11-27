'use client';
import { MistakeCounter } from '@entities/sudoku/ui/game-header/MistakeCounter';
import { SelectSelector } from '@entities/sudoku/ui/sudoku-game/SelectSelector';
import { TimerControl } from '@entities/sudoku/ui/sudoku-game/TimerControl';

export function GameStatus() {
  return (
    <>
      <SelectSelector />
      <MistakeCounter />
      <TimerControl />
    </>
  );
}
