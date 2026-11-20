'use client';
import { GetHint } from '@entities/sudoku/ui/sudoku-game/GetHint';
import { RedoMove } from '@entities/sudoku/ui/sudoku-game/RedoMove';
import { RemoveNumber } from '@entities/sudoku/ui/sudoku-game/RemoveNumber';
import { RestartGame } from '@entities/sudoku/ui/sudoku-game/RestartGame';
import { ToggleNote } from '@entities/sudoku/ui/sudoku-game/ToggleNote';
import { UndoMove } from '@entities/sudoku/ui/sudoku-game/UndoMove';
import React from 'react';

export const Controls: React.FC = () => (
  <div className="grid grid-cols-6 gap-2 md:gap-3 lg:gap-4 justify-items-center">
    <RestartGame />
    <UndoMove />
    <RedoMove />
    <RemoveNumber />
    <ToggleNote />
    <GetHint />
  </div>
);
