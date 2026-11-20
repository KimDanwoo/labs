import { MS_PER_SECOND, TIMER_TICK_MS } from '@views/slitherlink/config/timer';
import { useEffect, useState } from 'react';

export const useElapsedSeconds = (isRunning: boolean, resetKey: object | null): number => {
  const [seconds, setSeconds] = useState(0);
  const [trackedKey, setTrackedKey] = useState(resetKey);

  if (trackedKey !== resetKey) {
    setTrackedKey(resetKey);
    setSeconds(0);
  }

  useEffect(() => {
    if (!isRunning) return undefined;
    let countedUntil = Date.now();
    const id = setInterval(() => {
      const ticks = Math.floor((Date.now() - countedUntil) / MS_PER_SECOND);
      if (ticks === 0) return;
      countedUntil += ticks * MS_PER_SECOND;
      setSeconds((previous) => previous + ticks);
    }, TIMER_TICK_MS);
    return () => clearInterval(id);
  }, [isRunning, resetKey]);

  return seconds;
};
