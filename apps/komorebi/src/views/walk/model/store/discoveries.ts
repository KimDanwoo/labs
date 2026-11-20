import {
  DAY_PAGE_STORAGE_KEY,
  EVENING_DISCOVERY_STORAGE_KEY,
  LEGACY_DISCOVERY_STORAGE_KEY,
  NIGHT_PAGE_STORAGE_KEY,
  TIME,
  type TimeOfDay,
} from '@views/walk/config/walk';
import { createPersistentStore, type PersistentStore } from '@views/walk/model/store/persistentStore';
import { LANDMARKS } from '@views/walk/model/world/landmarks';

const NO_PAGES: readonly string[] = [];

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
