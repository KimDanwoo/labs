import { NUMBER_COUNTS } from '@entities/sudoku/config/board';
import { GAME_PHASE } from '@entities/sudoku/config/game';
import { buildGameResultState, resolveBoardState } from '@entities/sudoku/model/services/gameResult';
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
} from '@entities/sudoku/model/store/primitives';
import type { GamePhase } from '@entities/sudoku/model/types/game';
import { atom } from 'jotai';

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
