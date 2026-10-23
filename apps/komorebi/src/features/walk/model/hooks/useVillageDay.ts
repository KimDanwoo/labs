import { wakeFromSleep, weatherAfterRest, weatherDelay } from '@features/walk/lib/dayCycle';
import { WEATHER, type Weather } from '@features/walk/model/constants';
import { villageDayStore } from '@features/walk/model/store';
import { useEffect, useRef, useSyncExternalStore } from 'react';

export function useVillageDay(isPaused: boolean) {
  const today = useSyncExternalStore(villageDayStore.subscribe, villageDayStore.get, villageDayStore.getServer);
  const countdown = useRef<{ weather: Weather; remaining: number } | null>(null);
  useEffect(() => {
    if (isPaused) return undefined;
    let timer: ReturnType<typeof setTimeout>;
    let deadline = 0;
    const schedule = () => {
      const current = villageDayStore.get();
      const pending = countdown.current;
      const delay =
        pending?.weather === current.weather ? pending.remaining : weatherDelay(current.weather, Math.random());
      countdown.current = { weather: current.weather, remaining: delay };
      deadline = Date.now() + delay;
      timer = setTimeout(() => {
        const latest = villageDayStore.get();
        const weather = latest.weather === WEATHER.rain ? WEATHER.clear : weatherAfterRest(Math.random());
        countdown.current = { weather, remaining: weatherDelay(weather, Math.random()) };
        villageDayStore.set({ ...latest, weather });
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      clearTimeout(timer);
      if (countdown.current) countdown.current.remaining = Math.max(0, deadline - Date.now());
    };
  }, [isPaused, today.weather]);
  function wakeUp() {
    countdown.current = null;
    villageDayStore.set(wakeFromSleep(villageDayStore.get(), Math.random()));
  }
  return { ...today, wakeUp };
}
