import { SLEEP_TIMING } from '@features/walk/lib/bedRest';
import { useEffect, useEffectEvent } from 'react';

type Props = { onWake: () => void; onDone: () => void };

/** A short fade over the game canvas; sleeping never creates a second movement surface. */
export function SleepTransition({ onWake, onDone }: Props) {
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
  return (
    <div className="sleep-transition" role="status" style={{ animationDuration: `${SLEEP_TIMING.finish}ms` }}>
      <span>새근새근</span>
      <small>잠시 쉬어 가요.</small>
    </div>
  );
}
