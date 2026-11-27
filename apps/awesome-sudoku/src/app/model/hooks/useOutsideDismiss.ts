'use client';

import { useEffect, type RefObject } from 'react';

interface OutsideDismissOptions {
  rootRef: RefObject<HTMLElement | null>;
  isActive: boolean;
  onOutside: () => void;
  onEscape: () => void;
}

export function useOutsideDismiss({ rootRef, isActive, onOutside, onEscape }: OutsideDismissOptions): void {
  useEffect(() => {
    if (!isActive) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const isInside = event.target instanceof Node && rootRef.current?.contains(event.target);
      if (isInside) return;
      onOutside();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      onEscape();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [rootRef, isActive, onOutside, onEscape]);
}
