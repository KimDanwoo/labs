'use client';
import React from 'react';
import { GetHint } from '../sudoku-game/GetHint';
import { RedoMove } from '../sudoku-game/RedoMove';
import { RemoveNumber } from '../sudoku-game/RemoveNumber';
import { RestartGame } from '../sudoku-game/RestartGame';
import { ToggleNote } from '../sudoku-game/ToggleNote';
import { UndoMove } from '../sudoku-game/UndoMove';

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
