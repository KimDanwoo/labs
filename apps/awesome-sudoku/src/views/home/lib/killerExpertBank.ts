import { atIndex } from '@views/home/lib/gridAccess';
import { moveKillerPuzzle, randomGridMove } from '@views/home/lib/gridSymmetry';
import { decodeKillerPuzzle } from '@views/home/lib/killerPuzzleCodec';
import { randomInt } from '@views/home/lib/random';
import type { KillerPuzzle } from '@views/home/model/types/game';

export async function pickKillerExpertPuzzle(): Promise<KillerPuzzle> {
  const { KILLER_EXPERT_PUZZLES } = await import('@views/home/lib/killerExpertPuzzles');
  const encoded = atIndex(KILLER_EXPERT_PUZZLES, randomInt(KILLER_EXPERT_PUZZLES.length));
  return moveKillerPuzzle(decodeKillerPuzzle(encoded), randomGridMove());
}
