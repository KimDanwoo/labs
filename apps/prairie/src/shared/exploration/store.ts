'use client';

import { useSyncExternalStore } from 'react';
import { parseProgress } from './world';

const KEY = 'prairie.exploration.v1';
type Snapshot = {
  discovered: string[];
  best: number | null;
  nextGate: number;
  elapsed: number;
  active: boolean;
  notice: string;
  nearby: string;
  storageUnavailable: boolean;
};
const initial: Snapshot = {
  discovered: [],
  best: null,
  nextGate: 0,
  elapsed: 0,
  active: false,
  notice: '',
  nearby: '',
  storageUnavailable: false,
};
let snapshot = initial;
const listeners = new Set<() => void>();
export function updateExploration(patch: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
}
export function getExploration() {
  return snapshot;
}
export function loadExploration() {
  try {
    updateExploration({ ...initial, ...parseProgress(localStorage.getItem(KEY)) });
  } catch {
    updateExploration({ ...initial, storageUnavailable: true });
  }
}
export function saveExploration() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ discovered: snapshot.discovered, best: snapshot.best }));
  } catch {
    updateExploration({ storageUnavailable: true });
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function useExploration() {
  return useSyncExternalStore(subscribe, getExploration, () => initial);
}
export function resetCourse() {
  updateExploration({ active: false, nextGate: 0, elapsed: 0, notice: '첫 고리로 돌아가면 다시 시작해요' });
}
