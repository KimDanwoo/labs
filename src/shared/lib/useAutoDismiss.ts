'use client';

import { useEffect } from 'react';

export function useAutoDismiss(
  active: unknown,
  dismiss: () => void,
  durationMs: number,
): void {
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(dismiss, durationMs);
    return () => clearTimeout(timer);
  }, [active, dismiss, durationMs]);
}
