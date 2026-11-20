'use client';

import { COARSE_POINTER_QUERY } from '@shared/config/media';
import { useSyncExternalStore } from 'react';

function subscribe(listener: () => void) {
  const media = window.matchMedia(COARSE_POINTER_QUERY);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
const getSnapshot = () => window.matchMedia(COARSE_POINTER_QUERY).matches;
const getServerSnapshot = () => false;

export function useIsCoarsePointer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
