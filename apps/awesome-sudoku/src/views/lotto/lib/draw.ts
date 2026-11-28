import type { RandomInt } from '@shared/lib/random';
import { LOTTO_DRAWN_COUNT, LOTTO_MAX_NUMBER, LOTTO_PICK_COUNT } from '@views/lotto/config/lotto';
import type { LottoDraw } from '@views/lotto/model/types/lotto';

export const sortAscending = (numbers: readonly number[]): number[] => [...numbers].sort((a, b) => a - b);

export function createNumberPool(): Uint8Array {
  return Uint8Array.from({ length: LOTTO_MAX_NUMBER }, (_, index) => index + 1);
}

export function shuffleDrawnInto(pool: Uint8Array, randomInt: RandomInt): void {
  for (let index = 0; index < LOTTO_DRAWN_COUNT; index += 1) {
    const target = index + randomInt(pool.length - index);
    const picked = pool[target] ?? 0;
    pool[target] = pool[index] ?? 0;
    pool[index] = picked;
  }
}

export function drawNumbers(randomInt: RandomInt): LottoDraw {
  const pool = createNumberPool();
  shuffleDrawnInto(pool, randomInt);
  return {
    numbers: sortAscending(Array.from(pool.subarray(0, LOTTO_PICK_COUNT))),
    bonus: pool[LOTTO_PICK_COUNT] ?? 0,
  };
}

export const pickAutoNumbers = (randomInt: RandomInt): readonly number[] => drawNumbers(randomInt).numbers;
