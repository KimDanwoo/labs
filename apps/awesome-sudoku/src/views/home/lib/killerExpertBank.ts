import type { KillerPuzzle } from '../model/types/game';
import { atIndex } from './gridAccess';
import { moveKillerPuzzle, randomGridMove } from './gridSymmetry';
import { decodeKillerPuzzle } from './killerPuzzleCodec';
import { randomInt } from './random';

export async function pickKillerExpertPuzzle(): Promise<KillerPuzzle> {
  const { KILLER_EXPERT_PUZZLES } = await import('./killerExpertPuzzles');
  const encoded = atIndex(KILLER_EXPERT_PUZZLES, randomInt(KILLER_EXPERT_PUZZLES.length));
  return moveKillerPuzzle(decodeKillerPuzzle(encoded), randomGridMove());
}
