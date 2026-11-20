import { GAME_LEVEL, GAME_MODE } from '@views/home/config/game';
import { generateBoard, generateKillerBoard, generateSolution, toBoard } from '@views/home/lib/generator';
import { pickKillerExpertPuzzle } from '@views/home/lib/killerExpertBank';
import type { Grid, SudokuBoard } from '@views/home/model/types/board';
import type { Difficulty, GameMode, KillerCage } from '@views/home/model/types/game';

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
  if (gameMode === GAME_MODE.KILLER && difficulty === GAME_LEVEL.EXPERT) return killerExpertPuzzle();
  const solution = generateSolution();
  if (gameMode === GAME_MODE.KILLER) {
    const { board, cages } = generateKillerBoard(solution, difficulty);
    return { solution, board, cages };
  }
  return { solution, board: generateBoard(solution, difficulty), cages: [] };
}
