import { useSyncExternalStore } from 'react';
import { wasControlsHintSeen } from '@features/walk/model/store';

const subscribeNever = () => () => {};

export function useIsFirstVisit(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => !wasControlsHintSeen(),
    () => false,
  );
}
