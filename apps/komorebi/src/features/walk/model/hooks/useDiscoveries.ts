import type { DiscoveryStore } from '@features/walk/model/store';
import { useSyncExternalStore } from 'react';

export function useDiscoveries(store: DiscoveryStore): readonly string[] {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}
