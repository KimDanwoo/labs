import { getDiscoveries, getServerDiscoveries, subscribeDiscoveries } from '@features/walk/model/store';
import { useSyncExternalStore } from 'react';

export function useDiscoveries(): readonly string[] {
  return useSyncExternalStore(subscribeDiscoveries, getDiscoveries, getServerDiscoveries);
}
