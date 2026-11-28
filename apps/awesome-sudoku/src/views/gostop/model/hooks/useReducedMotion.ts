'use client';

import { useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const getSnapshot = (): boolean => window.matchMedia(REDUCED_MOTION_QUERY).matches;

const getServerSnapshot = (): boolean => false;

export const useReducedMotion = (): boolean => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
