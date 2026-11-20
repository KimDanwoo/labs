import { TIME_ORDER, type TimeOfDay } from '@views/walk/config/walk';
import { pageStores, type DiscoveryStore } from '@views/walk/model/store/discoveries';
import { LANDMARKS } from '@views/walk/model/world/landmarks';
import { useSyncExternalStore } from 'react';

function usePages(store: DiscoveryStore): readonly string[] {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}

export type Collection = {
  pages: Record<TimeOfDay, readonly string[]>;
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
