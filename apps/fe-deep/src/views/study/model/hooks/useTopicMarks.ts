'use client';

import { useCallback, useSyncExternalStore } from 'react';

type MarkMap = Record<string, string[]>;

const SERVER_MARKS = new Set<string>();
const cache = new Map<string, Set<string>>();
const listeners = new Map<string, Set<() => void>>();

function toCacheKey(storageKey: string, docSlug: string): string {
  return JSON.stringify([storageKey, docSlug]);
}

function readLocal(storageKey: string): MarkMap {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getMarks(storageKey: string, docSlug: string): Set<string> {
  const key = toCacheKey(storageKey, docSlug);
  const cached = cache.get(key);
  if (cached) return cached;
  const marks = new Set(readLocal(storageKey)[docSlug] ?? []);
  cache.set(key, marks);
  return marks;
}

function writeMarks(storageKey: string, docSlug: string, marks: Set<string>): void {
  const map = readLocal(storageKey);
  map[docSlug] = [...marks];
  localStorage.setItem(storageKey, JSON.stringify(map));

  const key = toCacheKey(storageKey, docSlug);
  cache.set(key, marks);
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribe(key: string, listener: () => void): () => void {
  const set = listeners.get(key) ?? new Set();
  listeners.set(key, set);
  set.add(listener);
  return () => {
    set.delete(listener);
    if (set.size > 0) return;
    listeners.delete(key);
    cache.delete(key);
  };
}

const subscribeNothing = () => () => {};

export function useTopicMarks(docSlug: string, storageKey: string) {
  const key = toCacheKey(storageKey, docSlug);
  const subscribeToMarks = useCallback((listener: () => void) => subscribe(key, listener), [key]);
  const marked = useSyncExternalStore(
    subscribeToMarks,
    () => getMarks(storageKey, docSlug),
    () => SERVER_MARKS,
  );
  const isLoaded = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  const toggle = useCallback(
    (topicTitle: string) => {
      const next = new Set(getMarks(storageKey, docSlug));
      if (next.has(topicTitle)) next.delete(topicTitle);
      else next.add(topicTitle);
      writeMarks(storageKey, docSlug, next);
    },
    [docSlug, storageKey],
  );

  const remove = useCallback(
    (topicTitles: string[]) => {
      const next = new Set([...getMarks(storageKey, docSlug)].filter((title) => !topicTitles.includes(title)));
      writeMarks(storageKey, docSlug, next);
    },
    [docSlug, storageKey],
  );

  return { marked, isLoaded, toggle, remove };
}
