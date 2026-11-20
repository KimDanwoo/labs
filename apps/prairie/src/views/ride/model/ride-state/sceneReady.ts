import { useSyncExternalStore } from 'react';

let ready = false;
const listeners = new Set<() => void>();

export function setSceneReady(): void {
  if (ready) return;
  ready = true;
  listeners.forEach((listen) => listen());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return ready;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useSceneReady(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
