import { SudokuBoard } from '@entities/board/model/types';
import { GAME_LEVEL, GAME_MODE, HINTS_REMAINING } from '@entities/game/model/constants';
import { Difficulty, GameMode, KillerCage } from '@entities/game/model/types';
import {
  createEmptyHighlights,
  generateBoard,
  generateKillerBoard,
  generateSolution,
} from '@features/sudoku-game/model/utils';
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
  isNoteModeAtom,
  isRecordSavedAtom,
  isSuccessAtom,
  mistakeCountAtom,
  selectedCellAtom,
  solutionAtom,
} from './primitives';
import { countBoardNumbersAtom } from './statusAtoms';
import { toggleTimerAtom } from './timerAtoms';

/** 새 게임 초기화 */
export const initializeGameAtom = atom(null, (get, set, difficulty: Difficulty = GAME_LEVEL.MEDIUM) => {
  const solution = generateSolution();
  const gameMode = get(gameModeAtom);

  let board: SudokuBoard;
  let cages: KillerCage[] = [];

  if (gameMode === GAME_MODE.KILLER) {
    const killerResult = generateKillerBoard(solution, difficulty);
    board = killerResult.board;
    cages = killerResult.cages;
  } else {
    board = generateBoard(solution, difficulty);
  }

  // initialSudokuState 에 해당하는 초기화
  set(boardAtom, board);
  set(solutionAtom, solution);
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
  set(cagesAtom, cages);

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
