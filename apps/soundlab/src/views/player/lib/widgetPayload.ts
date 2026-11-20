export const validDuration = (value: unknown, fallback: number) => {
  const isPositiveFinite = typeof value === 'number' && Number.isFinite(value) && value > 0;
  return isPositiveFinite ? value : fallback;
};

export const isValidPosition = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
