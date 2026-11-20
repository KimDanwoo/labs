import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';
import { SleepTransition } from '@views/walk/ui/SleepTransition';

export function WalkSleep() {
  const { isSleeping, today, finishSleep } = useWalkContext();
  if (!isSleeping) return null;
  return <SleepTransition onWake={today.wakeUp} onDone={finishSleep} />;
}
