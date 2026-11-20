import { GAME_LEVEL, HINTS_REMAINING } from '@entities/sudoku/config/game';
import { requestPuzzle } from '@entities/sudoku/lib/puzzleService';
import { createEmptyHighlights } from '@entities/sudoku/model/services/common';
import { isBoardPosition, isRestorableGame } from '@entities/sudoku/model/services/savedGame';
import { clearCellSelection } from '@entities/sudoku/model/services/update';
import { clearHistoryAtom } from '@entities/sudoku/model/store/historyAtoms';
import {
  boardAtom,
  cagesAtom,
  currentTimeAtom,
  difficultyAtom,
  gameModeAtom,
  highlightedCellsAtom,
  hintsRemainingAtom,
  isCompletedAtom,
  isGameReadyAtom,
  isGeneratingAtom,
  isNoteModeAtom,
  isSuccessAtom,
  mistakeCountAtom,
  selectedCellAtom,
  solutionAtom,
} from '@entities/sudoku/model/store/primitives';
import { selectCellAtom } from '@entities/sudoku/model/store/selectionAtoms';
import { countBoardNumbersAtom } from '@entities/sudoku/model/store/statusAtoms';
import { toggleTimerAtom } from '@entities/sudoku/model/store/timerAtoms';
import type { Difficulty } from '@entities/sudoku/model/types/game';
import { atom } from 'jotai';

let latestRequestId = 0;

export const initializeGameAtom = atom(null, async (get, set, difficulty: Difficulty = GAME_LEVEL.MEDIUM) => {
  const gameMode = get(gameModeAtom);
  const requestId = ++latestRequestId;
  set(isGeneratingAtom, true);

  const { solution, board, cages } = await requestPuzzle(gameMode, difficulty).catch((error: unknown) => {
    if (requestId === latestRequestId) set(isGeneratingAtom, false);
    throw error;
  });
  if (requestId !== latestRequestId) return;

  set(boardAtom, board);
  set(clearHistoryAtom);
  set(solutionAtom, solution);
  set(cagesAtom, cages);
  set(selectedCellAtom, null);
  set(isCompletedAtom, false);
  set(isSuccessAtom, false);
  set(currentTimeAtom, 0);
  set(difficultyAtom, difficulty);
  set(highlightedCellsAtom, createEmptyHighlights());
  set(hintsRemainingAtom, HINTS_REMAINING);
  set(mistakeCountAtom, 0);
  set(isNoteModeAtom, false);
  set(isGeneratingAtom, false);
  set(isGameReadyAtom, true);

  set(toggleTimerAtom, true);
  set(countBoardNumbersAtom);
});

export const resumeOrStartGameAtom = atom(null, async (get, set) => {
  if (get(isGeneratingAtom)) return;

  const savedGame = {
    board: get(boardAtom),
    solution: get(solutionAtom),
    gameMode: get(gameModeAtom),
    cages: get(cagesAtom),
  };
  const isFinishedOnLastVisit = !get(isGameReadyAtom) && get(isCompletedAtom);
  const shouldStartNewGame = isFinishedOnLastVisit || !isRestorableGame(savedGame);
  if (shouldStartNewGame) {
    await set(initializeGameAtom, GAME_LEVEL.MEDIUM);
    return;
  }

  set(isGameReadyAtom, true);
  set(countBoardNumbersAtom);
  const selectedCell: unknown = get(selectedCellAtom);
  if (isBoardPosition(selectedCell)) {
    set(selectCellAtom, selectedCell);
    return;
  }
  set(boardAtom, clearCellSelection(savedGame.board));
  set(selectedCellAtom, null);
  set(highlightedCellsAtom, createEmptyHighlights());
});

export const cancelPendingGenerationAtom = atom(null, (_get, set) => {
  latestRequestId += 1;
  set(isGeneratingAtom, false);
});

export const restartGameAtom = atom(null, (get, set) => {
  const difficulty = get(difficultyAtom);
  set(initializeGameAtom, difficulty);
});
