import { generatePuzzle, type GeneratedPuzzle } from '@entities/sudoku/lib/puzzleGenerator';
import type { Difficulty, GameMode } from '@entities/sudoku/model/types/game';

export type PuzzleRequest = { id: number; gameMode: GameMode; difficulty: Difficulty };
export type PuzzleResponse = { id: number; puzzle: GeneratedPuzzle } | { id: number; error: string };

self.onmessage = async (event: MessageEvent<PuzzleRequest>) => {
  const { id, gameMode, difficulty } = event.data;
  try {
    self.postMessage({ id, puzzle: await generatePuzzle(gameMode, difficulty) } satisfies PuzzleResponse);
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) } satisfies PuzzleResponse);
  }
};
