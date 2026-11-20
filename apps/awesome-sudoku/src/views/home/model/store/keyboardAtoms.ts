import { BOARD_MAX_INDEX } from '@views/home/config/board';
import { GAME_PHASE } from '@views/home/config/game';
import { fillCellAtom, toggleNoteAtom } from '@views/home/model/store/cellValueAtoms';
import { isNoteModeAtom, selectedCellAtom } from '@views/home/model/store/primitives';
import { selectCellAtom } from '@views/home/model/store/selectionAtoms';
import { gamePhaseAtom } from '@views/home/model/store/statusAtoms';
import { atom } from 'jotai';

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
