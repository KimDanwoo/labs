export const FISHING_PHASE = {
  idle: 'idle',
  waiting: 'waiting',
  bite: 'bite',
  caught: 'caught',
  missed: 'missed',
} as const;
export type FishingPhase = (typeof FISHING_PHASE)[keyof typeof FISHING_PHASE];
export const FISHING_STORAGE_KEY = 'komorebi-fish-v1';
export const BITE_WINDOW_MS = 1800;
export const FISH = [
  { id: 'goby', name: '망둑어', symbol: '🐟', rarity: '흔한', weight: 45, min: 8, max: 18 },
  { id: 'mackerel', name: '고등어', symbol: '🐟', rarity: '흔한', weight: 30, min: 20, max: 38 },
  { id: 'rockfish', name: '우럭', symbol: '🐠', rarity: '반가운', weight: 18, min: 18, max: 40 },
  { id: 'bream', name: '참돔', symbol: '🐠', rarity: '귀한', weight: 7, min: 25, max: 65 },
] as const;
export type Catch = { id: string; size: number };
export type FishCollection = Record<string, { count: number; best: number }>;
export function rollCatch(random = Math.random): Catch {
  let ticket = Math.max(0, Math.min(0.999999, random())) * 100;
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
export function parseCollection(raw: string | null): FishCollection {
  try {
    const data: unknown = JSON.parse(raw ?? '{}');
    if (!data || typeof data !== 'object') return {};
    const result: FishCollection = {};
    for (const fish of FISH) {
      const entry: unknown = (data as Record<string, unknown>)[fish.id];
      if (!entry || typeof entry !== 'object') continue;
      const { count, best } = entry as Record<string, unknown>;
      if (
        typeof count === 'number' &&
        Number.isSafeInteger(count) &&
        count > 0 &&
        typeof best === 'number' &&
        Number.isFinite(best) &&
        best >= fish.min &&
        best <= fish.max
      )
        result[fish.id] = { count, best };
    }
    return result;
  } catch {
    return {};
  }
}
export function isBiteOnTime(now: number, deadline: number) {
  return now < deadline;
}
