import { parseChalkboard, serializeChalkboard, type ChalkStroke } from '../../lib/chalkboard';

export const CHALKBOARD_KEY = 'komorebi-chalkboard-v1';
const BLANK: readonly ChalkStroke[] = [];
let current: readonly ChalkStroke[] | undefined;
const listeners = new Set<() => void>();

export const chalkboardStore = {
  get() {
    if (current) return current;
    try {
      current = parseChalkboard(localStorage.getItem(CHALKBOARD_KEY));
    } catch {
      current = BLANK;
    }
    return current;
  },
  getServer: () => BLANK,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  /** Keeps the board for this visit either way; false means it may not survive a reload. */
  set(next: readonly ChalkStroke[]) {
    current = next;
    listeners.forEach((listener) => listener());
    try {
      localStorage.setItem(CHALKBOARD_KEY, serializeChalkboard(next));
      return true;
    } catch {
      return false;
    }
  },
};
