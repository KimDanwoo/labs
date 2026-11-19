import {
  DAY_PAGE_STORAGE_KEY,
  EVENING_DISCOVERY_STORAGE_KEY,
  LEGACY_DISCOVERY_STORAGE_KEY,
  NIGHT_PAGE_STORAGE_KEY,
  TIME,
  type TimeOfDay,
} from '../../config/walk';
import { LANDMARKS } from '../world/landmarks';
import { createPersistentStore, type PersistentStore } from './persistentStore';

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

export interface DiscoveryStore extends Omit<PersistentStore<readonly string[]>, 'set'> {
  add: (id: string) => void;
}

function createDiscoveryStore(storageKey: string, read: () => string[]): DiscoveryStore {
  const { get, getServer, subscribe, set } = createPersistentStore<readonly string[]>({
    key: storageKey,
    read,
    fallback: NO_PAGES,
  });
  return {
    get,
    getServer,
    subscribe,
    add(id) {
      const current = get();
      if (!current.includes(id)) set([...current, id]);
    },
  };
}

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
