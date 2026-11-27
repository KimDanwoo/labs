'use client';
import { PANEL_GRID } from '@entities/sudoku/config/board';
import { GetHint } from '@entities/sudoku/ui/sudoku-game/GetHint';
import { RedoMove } from '@entities/sudoku/ui/sudoku-game/RedoMove';
import { RemoveNumber } from '@entities/sudoku/ui/sudoku-game/RemoveNumber';
import { RestartGame } from '@entities/sudoku/ui/sudoku-game/RestartGame';
import { ToggleNote } from '@entities/sudoku/ui/sudoku-game/ToggleNote';
import { UndoMove } from '@entities/sudoku/ui/sudoku-game/UndoMove';

export function Controls() {
  return (
    <div className={PANEL_GRID.tools}>
      <RestartGame />
      <UndoMove />
      <RedoMove />
      <RemoveNumber />
      <ToggleNote />
      <GetHint />
    </div>
  );
}
