import { GAME_LEVEL, HINTS_REMAINING } from '@entities/game/model/constants';
import type { Difficulty, GameMode } from '@entities/game/model/types';
import { requestPuzzle } from '@features/sudoku-game/model/services';
import { createEmptyHighlights } from '@features/sudoku-game/model/utils';
import { atom } from 'jotai';
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

/** 새 게임 초기화 — 생성은 워커에서 비동기로 돌고, 도착 전까지는 isGeneratingAtom이 true다 */
export const initializeGameAtom = atom(null, async (get, set, difficulty: Difficulty = GAME_LEVEL.MEDIUM) => {
  const gameMode = get(gameModeAtom);
  const requestId = ++latestRequest;
  set(isGeneratingAtom, true);

  const { solution, board, cages } = await requestPuzzle(gameMode, difficulty);
  if (requestId !== latestRequest) return;

  set(boardAtom, board);
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

/** 게임 모드 전환 */
export const switchGameModeAtom = atom(null, (get, set, args: { mode: GameMode; difficulty?: Difficulty }) => {
  const currentDifficulty = args.difficulty ?? get(difficultyAtom);
  set(gameModeAtom, args.mode);
  set(initializeGameAtom, currentDifficulty);
});

/** 게임 재시작 */
export const restartGameAtom = atom(null, (get, set) => {
  const difficulty = get(difficultyAtom);
  set(initializeGameAtom, difficulty);
});
