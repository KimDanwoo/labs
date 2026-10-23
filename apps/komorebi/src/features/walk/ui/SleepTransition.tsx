import { useEffect, useEffectEvent } from 'react';

type Props = { onWake: () => void; onDone: () => void };

/** A short fade over the game canvas; sleeping never creates a second movement surface. */
export function SleepTransition({ onWake, onDone }: Props) {
  const wake = useEffectEvent(onWake);
  const done = useEffectEvent(onDone);
  useEffect(() => {
    const morning = setTimeout(wake, 1100);
    const finish = setTimeout(done, 2300);
    return () => {
      clearTimeout(morning);
      clearTimeout(finish);
    };
  }, []);
  return (
    <div className="sleep-transition" role="status">
      <span>새근새근</span>
      <small>잠시 쉬어 가요.</small>
    </div>
  );
}
