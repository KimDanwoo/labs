import {
  boardAtom,
  cagesAtom,
  currentTimeAtom,
  difficultyAtom,
  hintsRemainingAtom,
  isCompletedAtom,
  isSuccessAtom,
  mistakeCountAtom,
  selectedCellAtom,
  solutionAtom,
  timerActiveAtom,
} from '@entities/sudoku/model/store/primitives';
import type { Position, SudokuCell } from '@entities/sudoku/model/types/board';
import type { Difficulty, GameMode, KillerCage } from '@entities/sudoku/model/types/game';
import type { Getter, Setter } from 'jotai';
import { atomWithStorage, RESET } from 'jotai/utils';

export interface ParkedGame {
  board: SudokuCell[][];
  solution: number[][];
  selectedCell: Position | null;
  isCompleted: boolean;
  isSuccess: boolean;
  currentTime: number;
  timerActive: boolean;
  difficulty: Difficulty;
  hintsRemaining: number;
  mistakeCount: number;
  cages: KillerCage[];
}

export type ParkedGames = Partial<Record<GameMode, ParkedGame>>;

export const parkedGamesAtom = atomWithStorage<ParkedGames>('sudoku:parkedGames', {});

export const readActiveGame = (get: Getter): ParkedGame => ({
  board: get(boardAtom),
  solution: get(solutionAtom),
  selectedCell: get(selectedCellAtom),
  isCompleted: get(isCompletedAtom),
  isSuccess: get(isSuccessAtom),
  currentTime: get(currentTimeAtom),
  timerActive: get(timerActiveAtom),
  difficulty: get(difficultyAtom),
  hintsRemaining: get(hintsRemainingAtom),
  mistakeCount: get(mistakeCountAtom),
  cages: get(cagesAtom),
});

export const writeActiveGame = (set: Setter, game: ParkedGame): void => {
  set(boardAtom, game.board);
  set(solutionAtom, game.solution);
  set(selectedCellAtom, game.selectedCell);
  set(isCompletedAtom, game.isCompleted);
  set(isSuccessAtom, game.isSuccess);
  set(currentTimeAtom, game.currentTime);
  set(timerActiveAtom, game.timerActive);
  set(difficultyAtom, game.difficulty);
  set(hintsRemainingAtom, game.hintsRemaining);
  set(mistakeCountAtom, game.mistakeCount);
  set(cagesAtom, game.cages);
};

export const clearActiveGame = (set: Setter): void => {
  set(boardAtom, RESET);
  set(solutionAtom, RESET);
  set(selectedCellAtom, RESET);
  set(isCompletedAtom, RESET);
  set(isSuccessAtom, RESET);
  set(currentTimeAtom, RESET);
  set(timerActiveAtom, RESET);
  set(hintsRemainingAtom, RESET);
  set(mistakeCountAtom, RESET);
  set(cagesAtom, RESET);
};
