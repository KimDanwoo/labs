import { GAME_MODE } from '@views/home/config/game';
import { cageLabelCell } from '@views/home/lib/cageLabelCell';
import { cagesAtom, gameModeAtom } from '@views/home/model/store/primitives';
import { atom } from 'jotai';

const NO_LABEL_CELLS: ReadonlySet<string> = new Set();

export const cageLabelCellsAtom = atom<ReadonlySet<string>>((get) => {
  if (get(gameModeAtom) !== GAME_MODE.KILLER) return NO_LABEL_CELLS;
  return new Set(get(cagesAtom).map((cage) => cageLabelCell(cage).join('-')));
});
