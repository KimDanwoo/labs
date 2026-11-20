export const FADE_MS = 700;

const PERCENT_DONE = 100;
const PERCENT_PENDING_MAX = 99;

export function loaderPercent(ready: boolean, progress: number): number {
  return ready ? PERCENT_DONE : Math.min(PERCENT_PENDING_MAX, Math.round(progress));
}
