import { createPersistentStore } from '@views/walk/model/store/persistentStore';
import { DEFAULT_APPEARANCE, parseAppearance } from '@views/walk/model/world/appearance';

export const APPEARANCE_KEY = 'komorebi-appearance-v1';

export const appearanceStore = createPersistentStore({
  key: APPEARANCE_KEY,
  read: () => parseAppearance(localStorage.getItem(APPEARANCE_KEY)),
  fallback: DEFAULT_APPEARANCE,
});
