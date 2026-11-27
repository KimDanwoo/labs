const RANDOM_POOL_SIZE = 16_384;
const UINT32_RANGE = 2 ** 32;

export type RandomInt = (bound: number) => number;

export function createCryptoRandom(): RandomInt {
  const pool = new Uint32Array(RANDOM_POOL_SIZE);
  let cursor = RANDOM_POOL_SIZE;

  const nextUint32 = (): number => {
    if (cursor === RANDOM_POOL_SIZE) {
      crypto.getRandomValues(pool);
      cursor = 0;
    }
    const value = pool[cursor] ?? 0;
    cursor += 1;
    return value;
  };

  return (bound) => {
    const limit = UINT32_RANGE - (UINT32_RANGE % bound);
    let value = nextUint32();
    while (value >= limit) value = nextUint32();
    return value % bound;
  };
}
