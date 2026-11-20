import { FISH, FISH_TOTAL_WEIGHT } from './fishTable';

export const FISHING_PHASE = {
  idle: 'idle',
  casting: 'casting',
  waiting: 'waiting',
  bite: 'bite',
  fighting: 'fighting',
  caught: 'caught',
  missed: 'missed',
} as const;
export type FishingPhase = (typeof FISHING_PHASE)[keyof typeof FISHING_PHASE];
export const FISHING_STORAGE_KEY = 'komorebi-fish-v1';
export const BITE_WINDOW_MS = 1800;
export type Catch = { id: string; size: number };
export type FishCollection = Record<string, { count: number; best: number }>;
export function rollCatch(random = Math.random): Catch {
  let ticket = Math.max(0, Math.min(0.999999, random())) * FISH_TOTAL_WEIGHT;
  const fish =
    FISH.find((item) => {
      ticket -= item.weight;
      return ticket < 0;
    }) ?? FISH[0];
  return { id: fish.id, size: Math.round(fish.min + Math.max(0, Math.min(1, random())) * (fish.max - fish.min)) };
}
export function addCatch(collection: FishCollection, caught: Catch): FishCollection {
  const previous = collection[caught.id];
  return {
    ...collection,
    [caught.id]: { count: (previous?.count ?? 0) + 1, best: Math.max(previous?.best ?? 0, caught.size) },
  };
}
function parseRecord(entry: unknown, min: number, max: number) {
  if (!entry || typeof entry !== 'object') return null;
  const { count, best } = entry as Record<string, unknown>;
  if (typeof count !== 'number' || !Number.isSafeInteger(count) || count <= 0) return null;
  if (typeof best !== 'number' || !Number.isFinite(best) || best < min || best > max) return null;
  return { count, best };
}

export function parseCollection(raw: string | null): FishCollection {
  try {
    const data: unknown = JSON.parse(raw ?? '{}');
    if (!data || typeof data !== 'object') return {};
    const result: FishCollection = {};
    for (const fish of FISH) {
      const record = parseRecord((data as Record<string, unknown>)[fish.id], fish.min, fish.max);
      if (record) result[fish.id] = record;
    }
    return result;
  } catch {
    return {};
  }
}
export function isBiteOnTime(now: number, deadline: number) {
  return now < deadline;
}

export type FishingFrame = {
  phase: FishingPhase;
  elapsed: number;
  tension: number;
  progress: number;
  isReeling: boolean;
  caught?: Catch | null;
  isSurging?: boolean;
};
export const CAST_SECONDS = 0.8;
