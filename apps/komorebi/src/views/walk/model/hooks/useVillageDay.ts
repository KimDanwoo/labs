import { useEffect, useRef, useSyncExternalStore } from 'react';
import { wakeFromSleep, weatherAfterRest, weatherDelay } from '../../lib/dayCycle';
import { WEATHER, type Weather } from '../constants/walk';
import { villageDayStore } from '../store/villageDay';

export function useVillageDay(isPaused: boolean) {
  const today = useSyncExternalStore(villageDayStore.subscribe, villageDayStore.get, villageDayStore.getServer);
  const countdown = useRef<{ weather: Weather; remaining: number } | null>(null);
  useEffect(() => {
    if (isPaused) return undefined;
    let timer: ReturnType<typeof setTimeout>;
    let deadline = 0;
    let scheduled: { weather: Weather; remaining: number };
    const schedule = () => {
      const current = villageDayStore.get();
      const pending = countdown.current;
      const delay =
        pending?.weather === current.weather ? pending.remaining : weatherDelay(current.weather, Math.random());
      scheduled = { weather: current.weather, remaining: delay };
      countdown.current = scheduled;
      deadline = Date.now() + delay;
      timer = setTimeout(() => {
        const latest = villageDayStore.get();
        const weather = latest.weather === WEATHER.rain ? WEATHER.clear : weatherAfterRest(Math.random());
        countdown.current = { weather, remaining: weatherDelay(weather, Math.random()) };
        if (weather === latest.weather) schedule();
        else villageDayStore.set({ ...latest, weather });
      }, delay);
    };
    schedule();
    return () => {
      clearTimeout(timer);
      if (countdown.current === scheduled) scheduled.remaining = Math.max(0, deadline - Date.now());
    };
  }, [isPaused, today.weather]);
  function wakeUp() {
    countdown.current = null;
    villageDayStore.set(wakeFromSleep(villageDayStore.get(), Math.random()));
  }
  return { ...today, wakeUp };
}
