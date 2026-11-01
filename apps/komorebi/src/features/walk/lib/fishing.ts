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
export const FISH_RARITY = { common: '흔한', uncommon: '반가운', rare: '귀한', legendary: '전설' } as const;
export const FISH_SHAPE = { slender: 'slender', round: 'round', flat: 'flat' } as const;
export const FISH = [
  {
    id: 'goby',
    name: '망둑어',
    symbol: '🐟',
    rarity: FISH_RARITY.common,
    weight: 18,
    min: 8,
    max: 18,
    shape: FISH_SHAPE.slender,
    color: 0xb89a70,
  },
  {
    id: 'mackerel',
    name: '고등어',
    symbol: '🐟',
    rarity: FISH_RARITY.common,
    weight: 14,
    min: 20,
    max: 38,
    shape: FISH_SHAPE.slender,
    color: 0x5a8fb5,
  },
  {
    id: 'horse-mackerel',
    name: '전갱이',
    symbol: '🐟',
    rarity: FISH_RARITY.common,
    weight: 12,
    min: 15,
    max: 32,
    shape: FISH_SHAPE.slender,
    color: 0x79b7b0,
  },
  {
    id: 'whiting',
    name: '보리멸',
    symbol: '🐟',
    rarity: FISH_RARITY.common,
    weight: 10,
    min: 10,
    max: 24,
    shape: FISH_SHAPE.slender,
    color: 0xd7c59e,
  },
  {
    id: 'mullet',
    name: '숭어',
    symbol: '🐟',
    rarity: FISH_RARITY.common,
    weight: 8,
    min: 25,
    max: 55,
    shape: FISH_SHAPE.slender,
    color: 0x849eab,
  },
  {
    id: 'black-rockfish',
    name: '볼락',
    symbol: '🐠',
    rarity: FISH_RARITY.uncommon,
    weight: 7,
    min: 12,
    max: 28,
    shape: FISH_SHAPE.round,
    color: 0x9b806d,
  },
  {
    id: 'rockfish',
    name: '우럭',
    symbol: '🐠',
    rarity: FISH_RARITY.uncommon,
    weight: 6,
    min: 18,
    max: 40,
    shape: FISH_SHAPE.round,
    color: 0x8c7c9c,
  },
  {
    id: 'greenling',
    name: '쥐노래미',
    symbol: '🐟',
    rarity: FISH_RARITY.uncommon,
    weight: 5,
    min: 18,
    max: 42,
    shape: FISH_SHAPE.slender,
    color: 0xa4a86a,
  },
  {
    id: 'flounder',
    name: '가자미',
    symbol: '🐠',
    rarity: FISH_RARITY.uncommon,
    weight: 4,
    min: 18,
    max: 40,
    shape: FISH_SHAPE.flat,
    color: 0xb49c70,
  },
  {
    id: 'sanddab',
    name: '도다리',
    symbol: '🐠',
    rarity: FISH_RARITY.uncommon,
    weight: 4,
    min: 15,
    max: 35,
    shape: FISH_SHAPE.flat,
    color: 0xc1a37b,
  },
  {
    id: 'bream',
    name: '참돔',
    symbol: '🐠',
    rarity: FISH_RARITY.rare,
    weight: 3,
    min: 25,
    max: 65,
    shape: FISH_SHAPE.round,
    color: 0xee9d9f,
  },
  {
    id: 'black-bream',
    name: '감성돔',
    symbol: '🐠',
    rarity: FISH_RARITY.rare,
    weight: 3,
    min: 25,
    max: 60,
    shape: FISH_SHAPE.round,
    color: 0x8095a5,
  },
  {
    id: 'striped-beakfish',
    name: '돌돔',
    symbol: '🐠',
    rarity: FISH_RARITY.rare,
    weight: 2,
    min: 20,
    max: 55,
    shape: FISH_SHAPE.round,
    color: 0xd4cdb2,
  },
  {
    id: 'sea-bass',
    name: '농어',
    symbol: '🐟',
    rarity: FISH_RARITY.rare,
    weight: 2,
    min: 35,
    max: 90,
    shape: FISH_SHAPE.slender,
    color: 0xaac5d0,
  },
  {
    id: 'yellowtail',
    name: '방어',
    symbol: '🐟',
    rarity: FISH_RARITY.legendary,
    weight: 1,
    min: 45,
    max: 110,
    shape: FISH_SHAPE.slender,
    color: 0x83b9a8,
  },
  {
    id: 'grouper',
    name: '다금바리',
    symbol: '🐠',
    rarity: FISH_RARITY.legendary,
    weight: 1,
    min: 40,
    max: 100,
    shape: FISH_SHAPE.round,
    color: 0xd49d67,
  },
] as const;
export const FISH_TOTAL_WEIGHT = FISH.reduce((total, fish) => total + fish.weight, 0);
export function isRareFish(id: string) {
  const fish = FISH.find((item) => item.id === id);
  return fish?.rarity === FISH_RARITY.rare || fish?.rarity === FISH_RARITY.legendary;
}
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
export function fishSurge(id: string, elapsed: number) {
  const index = Math.max(
    0,
    FISH.findIndex((fish) => fish.id === id),
  );
  const fish = FISH[index]!;
  let speed = 2.8;
  if (fish.shape === FISH_SHAPE.flat) speed = 1.4;
  if (fish.shape === FISH_SHAPE.round) speed = 1.9;
  return Math.sin(elapsed * (speed + index * 0.035) + index * 0.7) > (isRareFish(id) ? 0.2 : 0.45);
}
export function stepFight(state: Fight, isReeling: boolean, seconds: number, size: number, id = 'goby'): Fight {
  if (state.outcome !== FIGHT_OUTCOME.active) return state;
  const dt = Math.max(0, Math.min(0.1, seconds));
  const elapsed = state.elapsed + dt;
  const strength = Math.min(1, size / 65);
  const surge = fishSurge(id, elapsed);
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
