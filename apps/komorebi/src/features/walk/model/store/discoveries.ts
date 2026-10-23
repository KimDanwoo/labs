import {
  DAY_PAGE_STORAGE_KEY,
  EVENING_DISCOVERY_STORAGE_KEY,
  LEGACY_DISCOVERY_STORAGE_KEY,
  NIGHT_PAGE_STORAGE_KEY,
  TIME,
  type TimeOfDay,
} from '@features/walk/model/constants';
import { LANDMARKS } from '@shared/world/world';

const NO_PAGES: readonly string[] = [];

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

/**
 * Day pages come from their own key once it exists. Until then they start from the legacy list, which held every
 * place visited at any time, so earlier players keep every page they could already read.
 */
export function parseDayPages(dayRaw: string | null, legacyRaw: string | null): string[] {
  return parseDiscoveries(dayRaw ?? legacyRaw);
}

export type DiscoveryStore = {
  get: () => readonly string[];
  getServer: () => readonly string[];
  subscribe: (listener: () => void) => () => void;
  add: (id: string) => void;
};

function createDiscoveryStore(storageKey: string, read: () => string[]): DiscoveryStore {
  const listeners = new Set<() => void>();
  let ids: readonly string[] | null = null;
  const get = () => {
    if (ids) return ids;
    try {
      ids = read();
    } catch {
      ids = NO_PAGES;
    }
    return ids;
  };
  return {
    get,
    getServer: () => NO_PAGES,
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

/** One page per place and time of day: the same field reads differently at noon, at dusk and at night. */
export const pageStores = {
  [TIME.day]: createDiscoveryStore(DAY_PAGE_STORAGE_KEY, () =>
    parseDayPages(localStorage.getItem(DAY_PAGE_STORAGE_KEY), localStorage.getItem(LEGACY_DISCOVERY_STORAGE_KEY)),
  ),
  [TIME.evening]: createDiscoveryStore(EVENING_DISCOVERY_STORAGE_KEY, () =>
    parseDiscoveries(localStorage.getItem(EVENING_DISCOVERY_STORAGE_KEY)),
  ),
  [TIME.night]: createDiscoveryStore(NIGHT_PAGE_STORAGE_KEY, () =>
    parseDiscoveries(localStorage.getItem(NIGHT_PAGE_STORAGE_KEY)),
  ),
} satisfies Record<TimeOfDay, DiscoveryStore>;
