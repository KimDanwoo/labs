import type { SudokuBoard } from '../types/board';
import type { GameCompletionResult, GameMode, KillerCage } from '../types/game';
import { checkGameCompletion, validateBoard } from './update';

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
