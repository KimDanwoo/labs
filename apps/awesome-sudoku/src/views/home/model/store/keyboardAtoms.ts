import { atom } from 'jotai';
import { BOARD_MAX_INDEX } from '../../config/board';
import { GAME_PHASE } from '../../config/game';
import { fillCellAtom, toggleNoteAtom } from './cellValueAtoms';
import { isNoteModeAtom, selectedCellAtom } from './primitives';
import { selectCellAtom } from './selectionAtoms';
import { gamePhaseAtom } from './statusAtoms';

const ARROW_STEP: Record<string, { row: number; col: number }> = {
  ArrowUp: { row: -1, col: 0 },
  ArrowDown: { row: 1, col: 0 },
  ArrowLeft: { row: 0, col: -1 },
  ArrowRight: { row: 0, col: 1 },
};

function clampIndex(index: number): number {
  return Math.min(BOARD_MAX_INDEX, Math.max(0, index));
}

export const handleKeyInputAtom = atom(null, (get, set, key: string) => {
  if (get(gamePhaseAtom) !== GAME_PHASE.PLAYING) return;

  if (key === 'Backspace' || key === 'Delete') {
    set(fillCellAtom, null);
    return;
  }

  if (/^[1-9]$/.test(key)) {
    set(get(isNoteModeAtom) ? toggleNoteAtom : fillCellAtom, parseInt(key, 10));
    return;
  }

  const step = Object.hasOwn(ARROW_STEP, key) ? ARROW_STEP[key] : undefined;
  const selectedCell = get(selectedCellAtom);
  if (!step || !selectedCell) return;

  set(selectCellAtom, { row: clampIndex(selectedCell.row + step.row), col: clampIndex(selectedCell.col + step.col) });
});
