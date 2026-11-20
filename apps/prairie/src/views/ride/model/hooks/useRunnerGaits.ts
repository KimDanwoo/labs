import { startGaits, stopGaits, type Gaits } from '@views/ride/lib/runner/runnerPose';
import { useEffect, useRef, type RefObject } from 'react';
import type { AnimationAction } from 'three';

export function useRunnerGaits(actions: Record<string, AnimationAction | null>): RefObject<Gaits> {
  const gaitRef = useRef<Gaits>({ idle: null, walk: null, run: null, flight: null });
  useEffect(() => {
    const gaits = startGaits(actions);
    gaitRef.current = gaits;
    return () => stopGaits(gaits);
  }, [actions]);
  return gaitRef;
}
