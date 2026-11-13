import { useSyncExternalStore } from 'react';
import { roomFromHash } from '../together';

function subscribe(listener: () => void): () => void {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}
function getRoom(): string | null {
  return roomFromHash(window.location.hash);
}
function getServerRoom(): null {
  return null;
}

export function useInvitation(): string | null {
  return useSyncExternalStore(subscribe, getRoom, getServerRoom);
}
