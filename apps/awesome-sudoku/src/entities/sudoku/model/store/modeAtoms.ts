import { createEmptyHighlights } from '@entities/sudoku/model/services/common';
import { isRestorableGame } from '@entities/sudoku/model/services/savedGame';
import { gameConfirmAtom } from '@entities/sudoku/model/store/gameConfirmAtoms';
import { cancelPendingGenerationAtom, resumeOrStartGameAtom } from '@entities/sudoku/model/store/gameLifecycleAtoms';
import { clearHistoryAtom } from '@entities/sudoku/model/store/historyAtoms';
import {
  clearActiveGame,
  parkedGamesAtom,
  readActiveGame,
  writeActiveGame,
  type ParkedGame,
  type ParkedGames,
} from '@entities/sudoku/model/store/parkedGameAtoms';
import {
  gameModeAtom,
  highlightedCellsAtom,
  isGameReadyAtom,
  isNoteModeAtom,
} from '@entities/sudoku/model/store/primitives';
import type { GameMode } from '@entities/sudoku/model/types/game';
import { atom } from 'jotai';

const parkOutgoing = (others: ParkedGames, mode: GameMode, outgoing: ParkedGame): ParkedGames =>
  isRestorableGame({ ...outgoing, gameMode: mode }) ? { ...others, [mode]: outgoing } : others;

const swapActiveGameAtom = atom(null, (get, set, mode: GameMode) => {
  const { [mode]: incoming, ...others } = get(parkedGamesAtom);
  set(parkedGamesAtom, parkOutgoing(others, get(gameModeAtom), readActiveGame(get)));
  set(cancelPendingGenerationAtom);
  clearActiveGame(set);
  set(gameModeAtom, mode);
  if (incoming) writeActiveGame(set, incoming);
  set(clearHistoryAtom);
  set(isNoteModeAtom, false);
  set(highlightedCellsAtom, createEmptyHighlights());
  set(gameConfirmAtom, null);
  set(isGameReadyAtom, false);
});

export const enterModeAtom = atom(null, async (get, set, mode: GameMode) => {
  if (get(gameModeAtom) !== mode) set(swapActiveGameAtom, mode);
  await set(resumeOrStartGameAtom);
});
