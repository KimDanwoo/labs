export const RENDER_PIXELS = { desktop: 3_200_000, mobile: 1_250_000, software: 320_000 } as const;

export function boundedDpr(width: number, height: number, desired: number, budget: number) {
  return Math.min(desired, Math.sqrt(budget / Math.max(1, width * height)));
}
