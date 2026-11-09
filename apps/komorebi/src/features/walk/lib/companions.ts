import { type Catch, FISH } from './fishing';

export const COMPANION_KEY = 'komorebi-companions-v1';
export const TANK_CAPACITY = 8;
export const BAG_CAPACITY = 24;
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
  if (friendship >= 5) return { level: 2, name: '낚시 단짝', hint: '잡으면 나도 같이 폴짝! 늘 옆에서 기다릴게.' };
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
export function parseCompanions(raw: string | null): Companions {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object') return EMPTY_COMPANIONS;
    const data = value as Record<string, unknown>;
    const fish: KeptFish[] = [];
    const ids = new Set<string>();
    if (Array.isArray(data.fish))
      for (const entry of data.fish) {
        if (!isCatch(entry)) continue;
        const item = entry as Catch & Record<string, unknown>;
        if (typeof item.uid !== 'string' || !item.uid || item.uid.length > 100 || ids.has(item.uid)) continue;
        if (item.home !== FISH_HOME.bag && item.home !== FISH_HOME.tank) continue;
        const capacity = item.home === FISH_HOME.tank ? TANK_CAPACITY : BAG_CAPACITY;
        if (fish.filter((kept) => kept.home === item.home).length >= capacity) continue;
        ids.add(item.uid);
        fish.push({ id: item.id, size: item.size, uid: item.uid, home: item.home });
      }
    const friendship =
      typeof data.friendship === 'number' && Number.isSafeInteger(data.friendship)
        ? Math.max(0, Math.min(5, data.friendship))
        : 0;
    return { fish, friendship };
  } catch {
    return EMPTY_COMPANIONS;
  }
}

/** Moving or sharing consumes the exact catch, never the permanent fishing journal. */
export function changeCompanions(state: Companions, action: CompanionAction): Companions {
  if (action.kind === COMPANION_ACTION.keep) {
    if (!isCatch(action.fish) || !action.uid || state.fish.some((fish) => fish.uid === action.uid)) return state;
    if (state.fish.filter((fish) => fish.home === FISH_HOME.bag).length >= BAG_CAPACITY) return state;
    return { ...state, fish: [...state.fish, { ...action.fish, uid: action.uid, home: FISH_HOME.bag }] };
  }
  const fish = state.fish.find((item) => item.uid === action.uid);
  if (!fish) return state;
  if (action.kind === COMPANION_ACTION.share || action.kind === COMPANION_ACTION.release) {
    if (fish.home !== FISH_HOME.bag) return state;
    return {
      fish: state.fish.filter((item) => item.uid !== action.uid),
      friendship: Math.min(5, state.friendship + Number(action.kind === COMPANION_ACTION.share)),
    };
  }
  const home = action.kind === COMPANION_ACTION.tank ? FISH_HOME.tank : FISH_HOME.bag;
  if (fish.home === home) return state;
  if (
    state.fish.filter((item) => item.home === home).length >= (home === FISH_HOME.tank ? TANK_CAPACITY : BAG_CAPACITY)
  )
    return state;
  return { ...state, fish: state.fish.map((item) => (item.uid === action.uid ? { ...item, home } : item)) };
}

export const COMPANION_REACTION = { pet: 'pet', share: 'share', feed: 'feed' } as const;
export type CompanionReaction = (typeof COMPANION_REACTION)[keyof typeof COMPANION_REACTION];
