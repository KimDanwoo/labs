import { useEffect, useEffectEvent } from 'react';
import { SLEEP_TIMING } from '../../lib/bedRest';

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
