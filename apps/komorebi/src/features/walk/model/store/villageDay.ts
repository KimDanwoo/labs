import { FIRST_DAY, type VillageDay } from '@features/walk/lib/dayCycle';
import { TIME_ORDER, WEATHER } from '@features/walk/model/constants';

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

let current: VillageDay | undefined;
const listeners = new Set<() => void>();
export const villageDayStore = {
  get() {
    if (current) return current;
    try {
      current = parseVillageDay(localStorage.getItem(VILLAGE_DAY_KEY));
    } catch {
      current = FIRST_DAY;
    }
    return current;
  },
  getServer: () => FIRST_DAY,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  set(next: VillageDay) {
    current = next;
    try {
      localStorage.setItem(VILLAGE_DAY_KEY, JSON.stringify(next));
    } catch {
      /* A blocked or full storage must never prevent playing. */
    }
    listeners.forEach((listener) => listener());
  },
};
