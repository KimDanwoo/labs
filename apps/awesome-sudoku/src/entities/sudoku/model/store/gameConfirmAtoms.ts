import { hasPlayerProgress } from '@entities/sudoku/model/services/playerProgress';
import { resetUserInputsAtom } from '@entities/sudoku/model/store/cellValueAtoms';
import { initializeGameAtom } from '@entities/sudoku/model/store/gameLifecycleAtoms';
import { boardAtom, difficultyAtom, gameModeAtom, isCompletedAtom } from '@entities/sudoku/model/store/primitives';
import type { Difficulty, DiscardAction } from '@entities/sudoku/model/types/game';
import { atom } from 'jotai';

interface GameConfirm {
  action: DiscardAction;
  isOpen: boolean;
}

export const gameConfirmAtom = atom<GameConfirm | null>(null);

const isGameInProgressAtom = atom((get) => !get(isCompletedAtom) && hasPlayerProgress(get(boardAtom)));

const runDiscardAtom = atom(null, (_get, set, action: DiscardAction) => {
  if (action.kind === 'restart') {
    set(resetUserInputsAtom);
    return;
  }
  void set(initializeGameAtom, action.request.difficulty);
});

const requestDiscardAtom = atom(null, (get, set, action: DiscardAction) => {
  if (get(isGameInProgressAtom)) {
    set(gameConfirmAtom, { action, isOpen: true });
    return;
  }
  set(runDiscardAtom, action);
});

export const requestNewGameAtom = atom(null, (get, set, difficulty: Difficulty = get(difficultyAtom)) => {
  const request = { mode: get(gameModeAtom), difficulty };
  set(requestDiscardAtom, { kind: 'newGame', request });
});

export const requestRestartAtom = atom(null, (_get, set) => set(requestDiscardAtom, { kind: 'restart' }));

export const confirmDiscardAtom = atom(null, (get, set) => {
  const confirm = get(gameConfirmAtom);
  if (!confirm?.isOpen) return;
  set(gameConfirmAtom, { ...confirm, isOpen: false });
  set(runDiscardAtom, confirm.action);
});

export const keepCurrentGameAtom = atom(null, (get, set) => {
  const confirm = get(gameConfirmAtom);
  if (confirm) set(gameConfirmAtom, { ...confirm, isOpen: false });
});
