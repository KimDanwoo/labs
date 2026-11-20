import { SLEEP_TIMING } from '@views/walk/lib/bedRest';
import { useEffect, useEffectEvent } from 'react';

export function useSleepTimers(onWake: () => void, onDone: () => void) {
  const wake = useEffectEvent(onWake);
  const done = useEffectEvent(onDone);
  useEffect(() => {
    const morning = setTimeout(wake, SLEEP_TIMING.wake);
    const finish = setTimeout(done, SLEEP_TIMING.finish);
    return () => {
      clearTimeout(morning);
      clearTimeout(finish);
    };
  }, []);
}
