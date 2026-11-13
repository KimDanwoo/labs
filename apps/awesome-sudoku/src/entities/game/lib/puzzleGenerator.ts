import { GAME_MODE } from '../model/constants/game';
import type { Grid, SudokuBoard } from '../model/types/board';
import type { Difficulty, GameMode, KillerCage } from '../model/types/game';
import { generateBoard, generateKillerBoard, generateSolution } from './generator';

export type GeneratedPuzzle = {
  solution: Grid;
  board: SudokuBoard;
  cages: KillerCage[];
};

export function generatePuzzle(gameMode: GameMode, difficulty: Difficulty): GeneratedPuzzle {
  const solution = generateSolution();
  if (gameMode === GAME_MODE.KILLER) {
    const { board, cages } = generateKillerBoard(solution, difficulty);
    return { solution, board, cages };
  }
  return { solution, board: generateBoard(solution, difficulty), cages: [] };
}
