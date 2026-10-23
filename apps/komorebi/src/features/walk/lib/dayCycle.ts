import { TIME, TIME_ORDER, WEATHER, type TimeOfDay, type Weather } from '@features/walk/model/constants';

export type VillageDay = { day: number; time: TimeOfDay; weather: Weather };
export const FIRST_DAY: VillageDay = { day: 1, time: TIME.day, weather: WEATHER.clear };

export function weatherAfterRest(random: number): Weather {
  return random < 0.28 ? WEATHER.rain : WEATHER.clear;
}

export function wakeFromSleep(current: VillageDay, random: number): VillageDay {
  const time = TIME_ORDER[(TIME_ORDER.indexOf(current.time) + 1) % TIME_ORDER.length]!;
  return { day: current.day + (current.time === TIME.night ? 1 : 0), time, weather: weatherAfterRest(random) };
}

/** Showers pass through on their own; clear stretches are longer than rainy ones. */
export function weatherDelay(weather: Weather, random: number) {
  return weather === WEATHER.rain ? 45_000 + random * 45_000 : 100_000 + random * 100_000;
}
