import { STAMP_GAP_MS, STAMP_START_MS } from '@views/gostop/config/result';

const EASE_POWER = 3;

export function countUpValue(target: number, elapsedMs: number, durationMs: number): number {
  const progress = Math.min(Math.max(elapsedMs / durationMs, 0), 1);
  return Math.round(target * (1 - (1 - progress) ** EASE_POWER));
}

export const isCountDone = (elapsedMs: number, durationMs: number): boolean => elapsedMs >= durationMs;

export const stampDelay = (index: number): number => STAMP_START_MS + index * STAMP_GAP_MS;
