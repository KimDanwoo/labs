'use client';
import { GetHint, RedoMove, RemoveNumber, RestartGame, ToggleNote, UndoMove } from '@features/sudoku-game/ui';
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
