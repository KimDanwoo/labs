/** Before day pages had their own key, this list held every place visited at any time; it seeds the day pages. */
export const LEGACY_DISCOVERY_STORAGE_KEY = 'komorebi-discoveries-v1';
export const DAY_PAGE_STORAGE_KEY = 'komorebi-day-pages-v1';
export const EVENING_DISCOVERY_STORAGE_KEY = 'komorebi-evening-discoveries-v1';
export const NIGHT_PAGE_STORAGE_KEY = 'komorebi-night-pages-v1';
export const CONTROLS_SEEN_STORAGE_KEY = 'komorebi-controls-seen-v1';

export const DIALOG = {
  none: 'none',
  map: 'map',
  journal: 'journal',
  memory: 'memory',
  wardrobe: 'wardrobe',
  chalkboard: 'chalkboard',
} as const;
export type Dialog = (typeof DIALOG)[keyof typeof DIALOG];

export const TIME = { day: 'day', evening: 'evening', night: 'night' } as const;
export type TimeOfDay = (typeof TIME)[keyof typeof TIME];
export const TIME_ORDER: readonly TimeOfDay[] = [TIME.day, TIME.evening, TIME.night];
export const TIME_LABEL = { day: '한낮', evening: '해 질 녘', night: '밤' } satisfies Record<TimeOfDay, string>;

export const WEATHER = { clear: 'clear', rain: 'rain' } as const;
export type Weather = (typeof WEATHER)[keyof typeof WEATHER];

export const TOAST_DURATION_MS = 3_500;

export const FIRST_LOOK_LABEL = {
  day: '잠깐 머물러 보기',
  evening: '노을빛으로 머물러 보기',
  night: '밤의 풍경 바라보기',
} satisfies Record<TimeOfDay, string>;

export const FRIEND_ACTIVITY = { none: 'none', greeting: 'greeting', ball: 'ball' } as const;
