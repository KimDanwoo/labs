import { GAME_MODE } from '../constants/game';
import type { Grid, SudokuBoard } from '../types/board';
import type { Difficulty, GameMode, KillerCage } from '../types/game';
import { generateBoard, generateKillerBoard, generateSolution } from './generator';

export type GeneratedPuzzle = {
  solution: Grid;
  board: SudokuBoard;
  cages: KillerCage[];
};

/** 순수 생성 — 워커 안에서, 워커를 못 쓰는 환경(SSR·jsdom)에서는 메인 스레드에서 그대로 돈다 */
export function generatePuzzle(gameMode: GameMode, difficulty: Difficulty): GeneratedPuzzle {
  const solution = generateSolution();
  if (gameMode === GAME_MODE.KILLER) {
    const { board, cages } = generateKillerBoard(solution, difficulty);
    return { solution, board, cages };
  }
  return { solution, board: generateBoard(solution, difficulty), cages: [] };
}
