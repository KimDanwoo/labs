'use client';

import { useSyncExternalStore } from 'react';

const MD_BREAKPOINT = '(min-width: 768px)';

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(MD_BREAKPOINT);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(MD_BREAKPOINT).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
