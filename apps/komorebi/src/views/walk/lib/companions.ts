import { type Catch } from './fishing';
import { FISH } from './fishTable';

export const COMPANION_KEY = 'komorebi-companions-v1';
export const TANK_CAPACITY = 8;
export const BAG_CAPACITY = 24;
export const FRIENDSHIP_MAX = 5;
export const COMPANION_PANEL = { none: 'none', aquarium: 'aquarium', cat: 'cat' } as const;
export type CompanionPanelKind = (typeof COMPANION_PANEL)[keyof typeof COMPANION_PANEL];
export const FISH_HOME = { bag: 'bag', tank: 'tank' } as const;
export type KeptFish = Catch & { uid: string; home: (typeof FISH_HOME)[keyof typeof FISH_HOME] };
export type Companions = { fish: KeptFish[]; friendship: number };
export const EMPTY_COMPANIONS: Companions = { fish: [], friendship: 0 };
export const COMPANION_ACTION = { keep: 'keep', tank: 'tank', bag: 'bag', share: 'share', release: 'release' } as const;
export type CompanionAction =
  | { kind: typeof COMPANION_ACTION.keep; fish: Catch; uid: string }
  | { kind: Exclude<(typeof COMPANION_ACTION)[keyof typeof COMPANION_ACTION], 'keep'>; uid: string };

export function catBond(friendship: number) {
  if (friendship >= FRIENDSHIP_MAX)
    return { level: 2, name: '낚시 단짝', hint: '잡으면 나도 같이 폴짝! 늘 옆에서 기다릴게.' };
  if (friendship >= 2) return { level: 1, name: '반가운 친구', hint: '이제 네 옆에서 낚시를 구경할게.' };
  return { level: 0, name: '조심스러운 첫 만남', hint: '조금 떨어져 구경 중이에요. 물고기를 나눠 줘 볼까요?' };
}
function isCatch(value: unknown): value is Catch {
  if (!value || typeof value !== 'object') return false;
  const { id, size } = value as Record<string, unknown>;
  const species = FISH.find((fish) => fish.id === id);
  return Boolean(
    species && typeof size === 'number' && Number.isFinite(size) && size >= species.min && size <= species.max,
  );
}
const MAX_UID_LENGTH = 100;
type FishHome = KeptFish['home'];

function homeCapacity(home: FishHome) {
  return home === FISH_HOME.tank ? TANK_CAPACITY : BAG_CAPACITY;
}

function countAt(fish: readonly KeptFish[], home: FishHome) {
  return fish.filter((item) => item.home === home).length;
}

function isFreshUid(uid: unknown, ids: ReadonlySet<string>): uid is string {
  return typeof uid === 'string' && Boolean(uid) && uid.length <= MAX_UID_LENGTH && !ids.has(uid);
}

function parseKeptFish(entry: unknown, fish: readonly KeptFish[], ids: ReadonlySet<string>): KeptFish | null {
  if (!isCatch(entry)) return null;
  const item = entry as Catch & Record<string, unknown>;
  if (!isFreshUid(item.uid, ids)) return null;
  if (item.home !== FISH_HOME.bag && item.home !== FISH_HOME.tank) return null;
  if (countAt(fish, item.home) >= homeCapacity(item.home)) return null;
  return { id: item.id, size: item.size, uid: item.uid, home: item.home };
}

function parseKeptFishList(raw: unknown): KeptFish[] {
  if (!Array.isArray(raw)) return [];
  const fish: KeptFish[] = [];
  const ids = new Set<string>();
  for (const entry of raw) {
    const kept = parseKeptFish(entry, fish, ids);
    if (!kept) continue;
    ids.add(kept.uid);
    fish.push(kept);
  }
  return fish;
}

function parseFriendship(value: unknown) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) return 0;
  return Math.max(0, Math.min(FRIENDSHIP_MAX, value));
}

export function parseCompanions(raw: string | null): Companions {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object') return EMPTY_COMPANIONS;
    const data = value as Record<string, unknown>;
    return { fish: parseKeptFishList(data.fish), friendship: parseFriendship(data.friendship) };
  } catch {
    return EMPTY_COMPANIONS;
  }
}

function keepCatch(state: Companions, caught: Catch, uid: string): Companions {
  if (!isCatch(caught) || !uid || state.fish.some((fish) => fish.uid === uid)) return state;
  if (countAt(state.fish, FISH_HOME.bag) >= BAG_CAPACITY) return state;
  return { ...state, fish: [...state.fish, { ...caught, uid, home: FISH_HOME.bag }] };
}

function consumeFish(state: Companions, fish: KeptFish, isShare: boolean): Companions {
  if (fish.home !== FISH_HOME.bag) return state;
  return {
    fish: state.fish.filter((item) => item.uid !== fish.uid),
    friendship: Math.min(FRIENDSHIP_MAX, state.friendship + Number(isShare)),
  };
}

function moveFish(state: Companions, fish: KeptFish, home: FishHome): Companions {
  if (fish.home === home) return state;
  if (countAt(state.fish, home) >= homeCapacity(home)) return state;
  return { ...state, fish: state.fish.map((item) => (item.uid === fish.uid ? { ...item, home } : item)) };
}

/** Moving or sharing consumes the exact catch, never the permanent fishing journal. */
export function changeCompanions(state: Companions, action: CompanionAction): Companions {
  if (action.kind === COMPANION_ACTION.keep) return keepCatch(state, action.fish, action.uid);
  const fish = state.fish.find((item) => item.uid === action.uid);
  if (!fish) return state;
  if (action.kind === COMPANION_ACTION.share || action.kind === COMPANION_ACTION.release)
    return consumeFish(state, fish, action.kind === COMPANION_ACTION.share);
  return moveFish(state, fish, action.kind === COMPANION_ACTION.tank ? FISH_HOME.tank : FISH_HOME.bag);
}

export const COMPANION_REACTION = { pet: 'pet', share: 'share', feed: 'feed' } as const;
export type CompanionReaction = (typeof COMPANION_REACTION)[keyof typeof COMPANION_REACTION];
