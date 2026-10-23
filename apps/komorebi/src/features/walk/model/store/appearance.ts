import { DEFAULT_APPEARANCE, parseAppearance, type Appearance } from '@shared/world/appearance';

export const APPEARANCE_KEY = 'komorebi-appearance-v1';
let current: Appearance | undefined;
const listeners = new Set<() => void>();
export const appearanceStore = {
  get() {
    if (current) return current;
    try {
      current = parseAppearance(localStorage.getItem(APPEARANCE_KEY));
    } catch {
      current = DEFAULT_APPEARANCE;
    }
    return current;
  },
  getServer: () => DEFAULT_APPEARANCE,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  set(next: Appearance) {
    current = next;
    try {
      localStorage.setItem(APPEARANCE_KEY, JSON.stringify(next));
    } catch {
      /* Keep playing if storage is blocked. */
    }
    listeners.forEach((listener) => listener());
  },
};
