import { atIndex } from '@entities/sudoku/lib/gridAccess';
import { moveKillerPuzzle, randomGridMove } from '@entities/sudoku/lib/gridSymmetry';
import { decodeKillerPuzzle } from '@entities/sudoku/lib/killerPuzzleCodec';
import { randomInt } from '@entities/sudoku/lib/random';
import type { KillerPuzzle } from '@entities/sudoku/model/types/game';

export async function pickKillerExpertPuzzle(): Promise<KillerPuzzle> {
  const { KILLER_EXPERT_PUZZLES } = await import('@entities/sudoku/lib/killerExpertPuzzles');
  const encoded = atIndex(KILLER_EXPERT_PUZZLES, randomInt(KILLER_EXPERT_PUZZLES.length));
  return moveKillerPuzzle(decodeKillerPuzzle(encoded), randomGridMove());
}
