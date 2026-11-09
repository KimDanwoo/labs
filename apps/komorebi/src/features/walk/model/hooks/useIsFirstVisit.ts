import { useSyncExternalStore } from 'react';
import { wasControlsHintSeen } from '../store/controlsHint';

const subscribeNever = () => () => {};

export function useIsFirstVisit(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => !wasControlsHintSeen(),
    () => false,
  );
}
