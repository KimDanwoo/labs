'use client';

import { useSyncExternalStore } from 'react';

const INITIAL = { speed: 0, altitude: 0 };
let snapshot = INITIAL;
const listeners = new Set<() => void>();

export function setRideTelemetry(speed: number, altitude: number) {
  const next = { speed: Math.round(Math.abs(speed) * 3.6), altitude: Math.max(0, Math.round(altitude)) };
  if (next.speed === snapshot.speed && next.altitude === snapshot.altitude) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function useRideTelemetry() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => INITIAL,
  );
}
