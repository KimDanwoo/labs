import { TIME_ORDER, type TimeOfDay } from '@features/walk/model/constants';
import { pageStores, type DiscoveryStore } from '@features/walk/model/store';
import { LANDMARKS } from '@shared/world/world';
import { useSyncExternalStore } from 'react';

function usePages(store: DiscoveryStore): readonly string[] {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}

export type Collection = {
  pages: Record<TimeOfDay, readonly string[]>;
  /** Places seen at any time of day, in landmark order. */
  visited: string[];
  pageCount: number;
};

export function useCollection(): Collection {
  const pages = {
    day: usePages(pageStores.day),
    evening: usePages(pageStores.evening),
    night: usePages(pageStores.night),
  };
  const visited = LANDMARKS.map((p) => p.id).filter((id) => TIME_ORDER.some((time) => pages[time].includes(id)));
  const pageCount = TIME_ORDER.reduce((sum, time) => sum + pages[time].length, 0);
  return { pages, visited, pageCount };
}
