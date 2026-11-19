import { TIME_ORDER, WEATHER } from '../../config/walk';
import { FIRST_DAY, type VillageDay } from '../../lib/dayCycle';
import { createPersistentStore } from './persistentStore';

export const VILLAGE_DAY_KEY = 'komorebi-village-day-v1';

export function parseVillageDay(raw: string | null): VillageDay {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (
      !value ||
      !Number.isSafeInteger(value.day) ||
      value.day < 1 ||
      value.day > 999999 ||
      !TIME_ORDER.includes(value.time) ||
      !Object.values(WEATHER).includes(value.weather)
    )
      return FIRST_DAY;
    return { day: value.day, time: value.time, weather: value.weather };
  } catch {
    return FIRST_DAY;
  }
}

export const villageDayStore = createPersistentStore({
  key: VILLAGE_DAY_KEY,
  read: () => parseVillageDay(localStorage.getItem(VILLAGE_DAY_KEY)),
  fallback: FIRST_DAY,
});
