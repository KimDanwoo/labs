import { useCallback, useMemo, useState } from 'react';

export interface HandFocusControl {
  isHandFocusPending: boolean;
  requestHandFocus: () => void;
  settleHandFocus: () => void;
}

export const useHandFocusRequest = (): HandFocusControl => {
  const [isHandFocusPending, setIsHandFocusPending] = useState(false);
  const requestHandFocus = useCallback(() => setIsHandFocusPending(true), []);
  const settleHandFocus = useCallback(() => setIsHandFocusPending(false), []);

  return useMemo(
    () => ({ isHandFocusPending, requestHandFocus, settleHandFocus }),
    [isHandFocusPending, requestHandFocus, settleHandFocus],
  );
};
