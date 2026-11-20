import { wasControlsHintSeen } from '@views/walk/model/store/controlsHint';
import { useSyncExternalStore } from 'react';

const subscribeNever = () => () => {};

export function useIsFirstVisit(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => !wasControlsHintSeen(),
    () => false,
  );
}
