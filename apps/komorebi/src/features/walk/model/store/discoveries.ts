import { DISCOVERY_STORAGE_KEY, EVENING_DISCOVERY_STORAGE_KEY } from '@features/walk/model/constants';
import { LANDMARKS } from '@shared/world/world';

const NO_DISCOVERIES: readonly string[] = [];

/** Untrusted storage: keep known landmark ids once each, in their original order. */
export function parseDiscoveries(raw: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(parsed)) return [];
    const known = parsed.filter((id): id is string => typeof id === 'string' && LANDMARKS.some((p) => p.id === id));
    return [...new Set(known)];
  } catch {
    return [];
  }
}

export type DiscoveryStore = {
  get: () => readonly string[];
  getServer: () => readonly string[];
  subscribe: (listener: () => void) => () => void;
  add: (id: string) => void;
};

function createDiscoveryStore(storageKey: string): DiscoveryStore {
  const listeners = new Set<() => void>();
  let ids: readonly string[] | null = null;
  const load = () => {
    try {
      return parseDiscoveries(localStorage.getItem(storageKey));
    } catch {
      return NO_DISCOVERIES;
    }
  };
  const get = () => {
    ids ??= load();
    return ids;
  };
  return {
    get,
    getServer: () => NO_DISCOVERIES,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    add(id) {
      const current = get();
      if (current.includes(id)) return;
      ids = [...current, id];
      try {
        localStorage.setItem(storageKey, JSON.stringify(ids));
      } catch {
        /* The walk remains playable for this visit when storage is unavailable. */
      }
      listeners.forEach((listener) => listener());
    },
  };
}

/** Memories kept at any time of day; the evening set records the same places seen at dusk. */
export const dayDiscoveries = createDiscoveryStore(DISCOVERY_STORAGE_KEY);
export const eveningDiscoveries = createDiscoveryStore(EVENING_DISCOVERY_STORAGE_KEY);
