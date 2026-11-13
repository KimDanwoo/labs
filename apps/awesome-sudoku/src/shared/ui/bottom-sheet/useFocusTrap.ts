'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type UseFocusTrapOptions = {
  containerRef: RefObject<HTMLElement | null>;
  isActive: boolean;
  onEscape: () => void;
};

export function useFocusTrap({ containerRef, isActive, onEscape }: UseFocusTrapOptions): void {
  useEffect(() => {
    if (!isActive) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusable?.[0];
      const last = focusable?.[focusable.length - 1];
      if (!first || !last) return;

      const [edge, wrapTo] = event.shiftKey ? [first, last] : [last, first];
      if (document.activeElement !== edge) return;
      event.preventDefault();
      wrapTo.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, isActive, onEscape]);
}
