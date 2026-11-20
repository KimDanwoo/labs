import { BOARD_SIZE } from '@views/home/config/board';
import { bit } from '@views/home/lib/solverGrid';

const cageCombosCache = new Map<string, number[]>();
export const cageCombos = (size: number, sum: number): number[] => {
  const cacheKey = `${size}-${sum}`;
  const cached = cageCombosCache.get(cacheKey);
  if (cached) return cached;

  const combos: number[] = [];
  const build = (nextDigit: number, mask: number, count: number, total: number): void => {
    if (count === size) {
      if (total === sum) combos.push(mask);
      return;
    }
    for (let d = nextDigit; d <= BOARD_SIZE; d++) build(d + 1, mask | bit(d), count + 1, total + d);
  };
  build(1, 0, 0, 0);
  cageCombosCache.set(cacheKey, combos);
  return combos;
};
export type CageState = {
  combos: number[];
  usedMask: number;
  allowedCache: Map<number, number>;
};
export const cageAllowedMask = (cage: CageState): number => {
  const cached = cage.allowedCache.get(cage.usedMask);
  if (cached !== undefined) return cached;

  let allowed = 0;
  for (const combo of cage.combos) if ((combo & cage.usedMask) === cage.usedMask) allowed |= combo;
  allowed &= ~cage.usedMask;
  cage.allowedCache.set(cage.usedMask, allowed);
  return allowed;
};
