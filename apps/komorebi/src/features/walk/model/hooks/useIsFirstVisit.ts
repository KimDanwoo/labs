import { wasControlsHintSeen } from '@features/walk/model/store';
import { useSyncExternalStore } from 'react';

const subscribeNever = () => () => {};

export function useIsFirstVisit(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => !wasControlsHintSeen(),
    () => false,
  );
}
