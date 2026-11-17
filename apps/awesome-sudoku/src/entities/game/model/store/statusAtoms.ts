import { atom } from 'jotai';
import { NUMBER_COUNTS } from '../constants/board';
import { GAME_PHASE } from '../constants/game';
import { buildGameResultState, resolveBoardState } from '../services/gameResult';
import type { GamePhase } from '../types/game';
import {
  boardAtom,
  cagesAtom,
  gameModeAtom,
  isCompletedAtom,
  isGeneratingAtom,
  isSuccessAtom,
  numberCountsAtom,
  solutionAtom,
  timerActiveAtom,
} from './primitives';

export const gamePhaseAtom = atom<GamePhase>((get) => {
  if (get(isGeneratingAtom)) return GAME_PHASE.GENERATING;
  if (get(isCompletedAtom)) return get(isSuccessAtom) ? GAME_PHASE.WON : GAME_PHASE.FAILED;
  return get(timerActiveAtom) ? GAME_PHASE.PLAYING : GAME_PHASE.PAUSED;
});

export const countBoardNumbersAtom = atom(null, (get, set) => {
  const board = get(boardAtom);
  const counts = structuredClone(NUMBER_COUNTS);

  board.forEach((row) => {
    row.forEach((cell) => {
      if (cell.value !== null) {
        counts[cell.value as keyof typeof counts]++;
      }
    });
  });

  set(numberCountsAtom, counts);
});

export const checkSolutionAtom = atom(null, (get, set) => {
  const board = get(boardAtom);
  const solution = get(solutionAtom);
  const gameMode = get(gameModeAtom);
  const cages = get(cagesAtom);
  const { result } = resolveBoardState(board, solution, gameMode, cages);
  const state = buildGameResultState(result);

  set(boardAtom, state.board);
  set(isCompletedAtom, state.isCompleted);
  set(isSuccessAtom, state.isSuccess);
  set(timerActiveAtom, state.timerActive);
});
