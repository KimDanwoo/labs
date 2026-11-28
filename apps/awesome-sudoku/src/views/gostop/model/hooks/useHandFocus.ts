'use client';

import { shouldFocusHand } from '@views/gostop/lib/focus';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { useEffect, useRef, type RefObject } from 'react';

export const useHandFocus = (): RefObject<HTMLUListElement | null> => {
  const { isHandFocusPending, step, choice, myHand, settleHandFocus } = useGostopContext();
  const listRef = useRef<HTMLUListElement>(null);
  const isSettled = step === null && choice === null;
  const isReady = shouldFocusHand(isHandFocusPending, isSettled, myHand.length);

  useEffect(() => {
    if (!isReady) return;
    listRef.current?.querySelector('button')?.focus();
    settleHandFocus();
  }, [isReady, settleHandFocus]);

  return listRef;
};
