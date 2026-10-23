import { useSyncExternalStore } from 'react';
import { getDiscoveries, getServerDiscoveries, subscribeDiscoveries } from '@features/walk/model/store';

export function useDiscoveries(): readonly string[] {
  return useSyncExternalStore(subscribeDiscoveries, getDiscoveries, getServerDiscoveries);
}
