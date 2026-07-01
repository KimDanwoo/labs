import { SudokuBoard } from "@entities/board/model/types";
import { GameMode, GameCompletionResult, KillerCage } from "@entities/game/model/types";
import { checkGameCompletion, validateBoard } from "@features/sudoku-game/model/utils";

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
  const boardWithConflicts = validateBoard(board, gameMode, cages);
  const result = checkGameCompletion(boardWithConflicts, solution, gameMode, cages);

  return { boardWithConflicts, result };
};
