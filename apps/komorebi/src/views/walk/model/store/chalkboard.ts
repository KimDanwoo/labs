import { parseChalkboard, serializeChalkboard, type ChalkStroke } from '@views/walk/lib/chalkboard';
import { createPersistentStore } from '@views/walk/model/store/persistentStore';

export const CHALKBOARD_KEY = 'komorebi-chalkboard-v1';
const BLANK: readonly ChalkStroke[] = [];

export const chalkboardStore = createPersistentStore<readonly ChalkStroke[]>({
  key: CHALKBOARD_KEY,
  read: () => parseChalkboard(localStorage.getItem(CHALKBOARD_KEY)),
  fallback: BLANK,
  serialize: serializeChalkboard,
});
