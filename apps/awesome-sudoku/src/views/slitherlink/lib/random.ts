import { itemAt } from '@views/slitherlink/lib/itemAt';
import type { Random } from '@views/slitherlink/model/types/slitherlink';

export const randomInt = (random: Random, maxExclusive: number): number => Math.floor(random() * maxExclusive);

export const shuffled = <T>(random: Random, items: readonly T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = randomInt(random, index + 1);
    const current = itemAt(result, index);
    result[index] = itemAt(result, swap);
    result[swap] = current;
  }
  return result;
};
