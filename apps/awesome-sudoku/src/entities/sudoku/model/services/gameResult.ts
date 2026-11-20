import { checkGameCompletion, validateBoard } from '@entities/sudoku/model/services/update';
import type { SudokuBoard } from '@entities/sudoku/model/types/board';
import type { GameCompletionResult, GameMode, KillerCage } from '@entities/sudoku/model/types/game';

export const buildGameResultState = (result: GameCompletionResult) => ({
  board: result.board,
  isCompleted: result.completed,
  isSuccess: result.success,
  timerActive: !result.completed,
});

export const resolveBoardState = (
  board: SudokuBoard,
  solution: number[][],
  gameMode: GameMode,
  cages: KillerCage[],
) => {
  const boardWithConflicts = validateBoard(board, solution, gameMode, cages);
  const result = checkGameCompletion(boardWithConflicts, gameMode, cages);

  return { boardWithConflicts, result };
};
