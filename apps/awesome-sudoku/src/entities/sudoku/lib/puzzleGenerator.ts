import { GAME_LEVEL, GAME_MODE } from '@entities/sudoku/config/game';
import { generateBoard, generateKillerBoard, generateSolution, toBoard } from '@entities/sudoku/lib/generator';
import { pickKillerExpertPuzzle } from '@entities/sudoku/lib/killerExpertBank';
import type { Grid, SudokuBoard } from '@entities/sudoku/model/types/board';
import type { Difficulty, GameMode, KillerCage } from '@entities/sudoku/model/types/game';

export type GeneratedPuzzle = {
  solution: Grid;
  board: SudokuBoard;
  cages: KillerCage[];
};

async function killerExpertPuzzle(): Promise<GeneratedPuzzle> {
  const { solution, puzzle, cages } = await pickKillerExpertPuzzle();
  return { solution, board: toBoard(puzzle), cages };
}

export async function generatePuzzle(gameMode: GameMode, difficulty: Difficulty): Promise<GeneratedPuzzle> {
  const isKillerExpert = gameMode === GAME_MODE.KILLER && difficulty === GAME_LEVEL.EXPERT;
  if (isKillerExpert) return killerExpertPuzzle();
  const solution = generateSolution();
  if (gameMode === GAME_MODE.KILLER) {
    const { board, cages } = generateKillerBoard(solution, difficulty);
    return { solution, board, cages };
  }
  return { solution, board: generateBoard(solution, difficulty), cages: [] };
}
