import { atom } from 'jotai';
import { hasPlayerProgress } from '../services/playerProgress';
import type { NewGameRequest } from '../types/game';
import { switchGameModeAtom } from './gameLifecycleAtoms';
import { boardAtom, difficultyAtom, gameModeAtom, isCompletedAtom } from './primitives';

interface NewGameConfirm {
  request: NewGameRequest;
  isOpen: boolean;
}

export const newGameConfirmAtom = atom<NewGameConfirm | null>(null);

const isGameInProgressAtom = atom((get) => !get(isCompletedAtom) && hasPlayerProgress(get(boardAtom)));

export const requestNewGameAtom = atom(null, (get, set, change: Partial<NewGameRequest>) => {
  const request = { mode: change.mode ?? get(gameModeAtom), difficulty: change.difficulty ?? get(difficultyAtom) };
  if (get(isGameInProgressAtom)) {
    set(newGameConfirmAtom, { request, isOpen: true });
    return;
  }
  set(switchGameModeAtom, request);
});

export const confirmNewGameAtom = atom(null, (get, set) => {
  const confirm = get(newGameConfirmAtom);
  if (!confirm?.isOpen) return;
  set(newGameConfirmAtom, { ...confirm, isOpen: false });
  set(switchGameModeAtom, confirm.request);
});

export const keepCurrentGameAtom = atom(null, (get, set) => {
  const confirm = get(newGameConfirmAtom);
  if (confirm) set(newGameConfirmAtom, { ...confirm, isOpen: false });
});
