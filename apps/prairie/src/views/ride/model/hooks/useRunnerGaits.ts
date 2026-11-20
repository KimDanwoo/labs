import { useEffect, useRef, type RefObject } from 'react';
import type { AnimationAction } from 'three';
import { startGaits, stopGaits, type Gaits } from '../../lib/runner/runnerPose';

export function useRunnerGaits(actions: Record<string, AnimationAction | null>): RefObject<Gaits> {
  const gaitRef = useRef<Gaits>({ idle: null, walk: null, run: null, flight: null });
  useEffect(() => {
    const gaits = startGaits(actions);
    gaitRef.current = gaits;
    return () => stopGaits(gaits);
  }, [actions]);
  return gaitRef;
}
