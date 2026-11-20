import { GAME_MODE } from '@entities/sudoku/config/game';
import { cageLabelCell } from '@entities/sudoku/lib/cageLabelCell';
import { cagesAtom, gameModeAtom } from '@entities/sudoku/model/store/primitives';
import { atom } from 'jotai';

const NO_LABEL_CELLS: ReadonlySet<string> = new Set();

export const cageLabelCellsAtom = atom<ReadonlySet<string>>((get) => {
  if (get(gameModeAtom) !== GAME_MODE.KILLER) return NO_LABEL_CELLS;
  return new Set(get(cagesAtom).map((cage) => cageLabelCell(cage).join('-')));
});
