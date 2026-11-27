import { LOTTO_PICK_COUNT, SIMULATION_CHUNK_SIZE } from '@views/lotto/config/lotto';
import { createNumberPool, shuffleDrawnInto } from '@views/lotto/lib/draw';
import type { RandomInt } from '@views/lotto/lib/random';
import { createTicketFlags, gradeMatches } from '@views/lotto/lib/rank';
import { createEmptyTally, mergeTally } from '@views/lotto/lib/tally';
import type { SimulationRequest, SimulationResult, Tally } from '@views/lotto/model/types/lotto';

interface ChunkInput {
  flags: Uint8Array;
  pool: Uint8Array;
  size: number;
  shouldStopOnJackpot: boolean;
}

const countDrawnMatches = (flags: Uint8Array, pool: Uint8Array): number => {
  let matches = 0;
  for (let index = 0; index < LOTTO_PICK_COUNT; index += 1) matches += flags[pool[index] ?? 0] ?? 0;
  return matches;
};

const hasDrawnBonus = (flags: Uint8Array, pool: Uint8Array): boolean => flags[pool[LOTTO_PICK_COUNT] ?? 0] === 1;

export function runTicketChunk({ flags, pool, size, shouldStopOnJackpot }: ChunkInput, randomInt: RandomInt): Tally {
  const tally = createEmptyTally();
  for (let ticket = 0; ticket < size; ticket += 1) {
    shuffleDrawnInto(pool, randomInt);
    const rank = gradeMatches(countDrawnMatches(flags, pool), hasDrawnBonus(flags, pool));
    tally.tickets += 1;
    if (rank === null) continue;
    tally.counts[rank] += 1;
    const isJackpotStop = rank === 1 && shouldStopOnJackpot;
    if (isJackpotStop) break;
  }
  return tally;
}

export const targetTicketsOf = (request: SimulationRequest): number =>
  request.mode === 'bulk' ? request.count : request.limit;

export function* simulateInChunks(request: SimulationRequest, randomInt: RandomInt): Generator<SimulationResult> {
  const flags = createTicketFlags(request.ticket);
  const pool = createNumberPool();
  const target = targetTicketsOf(request);
  const shouldStopOnJackpot = request.mode === 'jackpot';
  let total = createEmptyTally();

  while (total.tickets < target) {
    const size = Math.min(SIMULATION_CHUNK_SIZE, target - total.tickets);
    total = mergeTally(total, runTicketChunk({ flags, pool, size, shouldStopOnJackpot }, randomInt));
    const hasJackpot = total.counts[1] > 0;
    yield { tally: total, hasJackpot };
    const isJackpotReached = shouldStopOnJackpot && hasJackpot;
    if (isJackpotReached) return;
  }
}
