import { atom } from 'jotai';
import { requestPuzzle } from '../../lib/puzzleService';
import { GAME_LEVEL, HINTS_REMAINING } from '../constants/game';
import { createEmptyHighlights } from '../services/common';
import type { Difficulty, GameMode } from '../types/game';
import { clearHistoryAtom } from './historyAtoms';
import {
  boardAtom,
  cagesAtom,
  currentTimeAtom,
  difficultyAtom,
  gameModeAtom,
  highlightedCellsAtom,
  hintsRemainingAtom,
  isCompletedAtom,
  isGeneratingAtom,
  isNoteModeAtom,
  isRecordSavedAtom,
  isSuccessAtom,
  mistakeCountAtom,
  selectedCellAtom,
  solutionAtom,
} from './primitives';
import { countBoardNumbersAtom } from './statusAtoms';
import { toggleTimerAtom } from './timerAtoms';

/** 마지막 요청만 반영한다 — 생성 중에 난이도를 연타하면 먼저 도착한 옛 판이 새 판을 덮어쓴다 */
let latestRequest = 0;

export const initializeGameAtom = atom(null, async (get, set, difficulty: Difficulty = GAME_LEVEL.MEDIUM) => {
  const gameMode = get(gameModeAtom);
  const requestId = ++latestRequest;
  set(isGeneratingAtom, true);

  const { solution, board, cages } = await requestPuzzle(gameMode, difficulty);
  if (requestId !== latestRequest) return;

  set(boardAtom, board);
  set(clearHistoryAtom);
  set(solutionAtom, solution);
  set(cagesAtom, cages);
  set(selectedCellAtom, null);
  set(isCompletedAtom, false);
  set(isSuccessAtom, false);
  set(isRecordSavedAtom, false);
  set(currentTimeAtom, 0);
  set(difficultyAtom, difficulty);
  set(highlightedCellsAtom, createEmptyHighlights());
  set(hintsRemainingAtom, HINTS_REMAINING);
  set(mistakeCountAtom, 0);
  set(isNoteModeAtom, false);
  set(isGeneratingAtom, false);

  set(toggleTimerAtom, true);
  set(countBoardNumbersAtom);
});

export const switchGameModeAtom = atom(null, (get, set, args: { mode: GameMode; difficulty?: Difficulty }) => {
  const currentDifficulty = args.difficulty ?? get(difficultyAtom);
  set(gameModeAtom, args.mode);
  set(initializeGameAtom, currentDifficulty);
});

export const restartGameAtom = atom(null, (get, set) => {
  const difficulty = get(difficultyAtom);
  set(initializeGameAtom, difficulty);
});
