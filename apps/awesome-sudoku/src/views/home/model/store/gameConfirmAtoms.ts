import { atom } from 'jotai';
import { hasPlayerProgress } from '../services/playerProgress';
import type { DiscardAction, NewGameRequest } from '../types/game';
import { resetUserInputsAtom } from './cellValueAtoms';
import { switchGameModeAtom } from './gameLifecycleAtoms';
import { boardAtom, difficultyAtom, gameModeAtom, isCompletedAtom } from './primitives';

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
  set(switchGameModeAtom, action.request);
});

const requestDiscardAtom = atom(null, (get, set, action: DiscardAction) => {
  if (get(isGameInProgressAtom)) {
    set(gameConfirmAtom, { action, isOpen: true });
    return;
  }
  set(runDiscardAtom, action);
});

export const requestNewGameAtom = atom(null, (get, set, change: Partial<NewGameRequest>) => {
  const request = { mode: change.mode ?? get(gameModeAtom), difficulty: change.difficulty ?? get(difficultyAtom) };
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
