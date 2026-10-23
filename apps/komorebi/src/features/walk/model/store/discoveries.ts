import { DISCOVERY_STORAGE_KEY } from '@features/walk/model/constants';
import { LANDMARKS } from '@shared/world/world';

const NO_DISCOVERIES: readonly string[] = [];
const listeners = new Set<() => void>();
let discoveries: readonly string[] | null = null;

/** Untrusted storage: keep known landmark ids once each, in their original order. */
export function parseDiscoveries(raw: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(parsed)) return [];
    const known = parsed.filter((id): id is string => typeof id === 'string' && LANDMARKS.some((p) => p.id === id));
    return [...new Set(known)];
  } catch {
    return [];
  }
}

function load(): readonly string[] {
  try {
    return parseDiscoveries(localStorage.getItem(DISCOVERY_STORAGE_KEY));
  } catch {
    return NO_DISCOVERIES;
  }
}

export function getDiscoveries(): readonly string[] {
  discoveries ??= load();
  return discoveries;
}

export function getServerDiscoveries(): readonly string[] {
  return NO_DISCOVERIES;
}

export function subscribeDiscoveries(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addDiscovery(id: string) {
  const current = getDiscoveries();
  if (current.includes(id)) return;
  discoveries = [...current, id];
  try {
    localStorage.setItem(DISCOVERY_STORAGE_KEY, JSON.stringify(discoveries));
  } catch {
    /* The walk remains playable for this visit when storage is unavailable. */
  }
  listeners.forEach((listener) => listener());
}
