'use client';
import { GetHint } from '@views/home/ui/sudoku-game/GetHint';
import { RedoMove } from '@views/home/ui/sudoku-game/RedoMove';
import { RemoveNumber } from '@views/home/ui/sudoku-game/RemoveNumber';
import { RestartGame } from '@views/home/ui/sudoku-game/RestartGame';
import { ToggleNote } from '@views/home/ui/sudoku-game/ToggleNote';
import { UndoMove } from '@views/home/ui/sudoku-game/UndoMove';
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
