'use client';

import { useEffect } from 'react';

export const useAutoDismiss = (onDismiss: () => void, delayMs: number): void => {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, delayMs);
    return () => window.clearTimeout(timer);
  }, [onDismiss, delayMs]);
};
