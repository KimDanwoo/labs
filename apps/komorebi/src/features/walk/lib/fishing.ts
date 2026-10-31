export const FISHING_PHASE = {
  idle: 'idle',
  waiting: 'waiting',
  bite: 'bite',
  fighting: 'fighting',
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

export const FIGHT_OUTCOME = { active: 'active', landed: 'landed', snapped: 'snapped', escaped: 'escaped' } as const;
export type Fight = {
  tension: number;
  progress: number;
  elapsed: number;
  outcome: (typeof FIGHT_OUTCOME)[keyof typeof FIGHT_OUTCOME];
};
export function startFight(isPerfect: boolean): Fight {
  return { tension: 40, progress: isPerfect ? 20 : 10, elapsed: 0, outcome: FIGHT_OUTCOME.active };
}
export function stepFight(state: Fight, isReeling: boolean, seconds: number, size: number): Fight {
  if (state.outcome !== FIGHT_OUTCOME.active) return state;
  const dt = Math.max(0, Math.min(0.1, seconds));
  const elapsed = state.elapsed + dt;
  const strength = Math.min(1, size / 65);
  const surge = Math.sin(elapsed * 2.4) > 0.45;
  const tension = Math.max(
    0,
    Math.min(100, state.tension + (isReeling ? 23 + strength * 12 + (surge ? 20 : 0) : -30 + (surge ? 12 : 0)) * dt),
  );
  const progress = Math.max(
    0,
    Math.min(100, state.progress + (isReeling && tension >= 20 && tension <= 80 ? 28 - strength * 8 : -3) * dt),
  );
  let outcome: Fight['outcome'] = FIGHT_OUTCOME.active;
  if (tension >= 100) outcome = FIGHT_OUTCOME.snapped;
  else if (tension <= 0 || progress <= 0) outcome = FIGHT_OUTCOME.escaped;
  else if (progress >= 100) outcome = FIGHT_OUTCOME.landed;
  return { tension, progress, elapsed, outcome };
}
