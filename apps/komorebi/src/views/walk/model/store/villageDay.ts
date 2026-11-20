import { TIME_ORDER, WEATHER } from '@views/walk/config/walk';
import { FIRST_DAY, type VillageDay } from '@views/walk/lib/dayCycle';
import { createPersistentStore } from '@views/walk/model/store/persistentStore';

export const VILLAGE_DAY_KEY = 'komorebi-village-day-v1';

export function parseVillageDay(raw: string | null): VillageDay {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value) return FIRST_DAY;
    if (!Number.isSafeInteger(value.day)) return FIRST_DAY;
    if (value.day < 1) return FIRST_DAY;
    if (value.day > 999999) return FIRST_DAY;
    if (!TIME_ORDER.includes(value.time)) return FIRST_DAY;
    if (!Object.values(WEATHER).includes(value.weather)) return FIRST_DAY;
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
