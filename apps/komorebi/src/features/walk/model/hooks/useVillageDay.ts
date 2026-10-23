import { FIRST_DAY, wakeFromSleep, weatherAfterRest, weatherDelay } from '@features/walk/lib/dayCycle';
import { WEATHER } from '@features/walk/model/constants';
import { useEffect, useState } from 'react';

export function useVillageDay(isPaused: boolean) {
  const [today, setToday] = useState(FIRST_DAY);
  useEffect(() => {
    if (isPaused) return undefined;
    let timer: ReturnType<typeof setTimeout>;
    let weather = today.weather;
    const schedule = () => {
      timer = setTimeout(
        () => {
          weather = weather === WEATHER.rain ? WEATHER.clear : weatherAfterRest(Math.random());
          setToday((current) => ({ ...current, weather }));
          schedule();
        },
        weatherDelay(weather, Math.random()),
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [isPaused, today.weather]);
  function wakeUp() {
    // Sample once per sleep, outside React's replayable state updater.
    const random = Math.random();
    setToday((current) => wakeFromSleep(current, random));
  }
  return { ...today, wakeUp };
}
