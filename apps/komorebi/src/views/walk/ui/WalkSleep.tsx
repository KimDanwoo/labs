import { useWalkContext } from '../model/hooks/useWalkContext';
import { SleepTransition } from './SleepTransition';

export function WalkSleep() {
  const { isSleeping, today, finishSleep } = useWalkContext();
  if (!isSleeping) return null;
  return <SleepTransition onWake={today.wakeUp} onDone={finishSleep} />;
}
