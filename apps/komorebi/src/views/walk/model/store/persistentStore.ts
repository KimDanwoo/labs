export interface PersistentStore<T> {
  get: () => T;
  getServer: () => T;
  subscribe: (listener: () => void) => () => void;
  set: (next: T) => boolean;
}

interface PersistentStoreOptions<T> {
  key: string;
  read: () => T;
  fallback: T;
  serialize?: (value: T) => string;
}

export function createPersistentStore<T>({
  key,
  read,
  fallback,
  serialize = JSON.stringify,
}: PersistentStoreOptions<T>): PersistentStore<T> {
  const listeners = new Set<() => void>();
  let current: T | undefined;
  const get = () => {
    if (current !== undefined) return current;
    try {
      current = read();
    } catch {
      current = fallback;
    }
    return current;
  };
  return {
    get,
    getServer: () => fallback,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next) {
      current = next;
      listeners.forEach((listener) => listener());
      try {
        localStorage.setItem(key, serialize(next));
        return true;
      } catch {
        return false;
      }
    },
  };
}
