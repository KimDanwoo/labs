import { parseChalkboard, serializeChalkboard, type ChalkStroke } from '../../lib/chalkboard';
import { createPersistentStore } from './persistentStore';

export const CHALKBOARD_KEY = 'komorebi-chalkboard-v1';
const BLANK: readonly ChalkStroke[] = [];

/** `set` keeps the board for this visit either way; false means it may not survive a reload. */
export const chalkboardStore = createPersistentStore<readonly ChalkStroke[]>({
  key: CHALKBOARD_KEY,
  read: () => parseChalkboard(localStorage.getItem(CHALKBOARD_KEY)),
  fallback: BLANK,
  serialize: serializeChalkboard,
});
