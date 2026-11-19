import { DEFAULT_APPEARANCE, parseAppearance } from '../world/appearance';
import { createPersistentStore } from './persistentStore';

export const APPEARANCE_KEY = 'komorebi-appearance-v1';

export const appearanceStore = createPersistentStore({
  key: APPEARANCE_KEY,
  read: () => parseAppearance(localStorage.getItem(APPEARANCE_KEY)),
  fallback: DEFAULT_APPEARANCE,
});
