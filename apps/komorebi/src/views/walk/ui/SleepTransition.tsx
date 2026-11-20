import { SLEEP_TIMING } from '../lib/bedRest';
import { useSleepTimers } from '../model/hooks/useSleepTimers';

interface SleepTransitionProps {
  onWake: () => void;
  onDone: () => void;
}

export function SleepTransition({ onWake, onDone }: SleepTransitionProps) {
  useSleepTimers(onWake, onDone);
  return (
    <div className="sleep-transition" role="status" style={{ animationDuration: `${SLEEP_TIMING.finish}ms` }}>
      <span>새근새근</span>
      <small>잠시 쉬어 가요.</small>
    </div>
  );
}
