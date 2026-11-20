'use client';

import { ANIMATION_MS, overwriteDraggedStyleWithHidden, PHASE, type Phase } from '@shared/ui/bottom-sheet/sheetMotion';
import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type RefObject } from 'react';

type UseSheetPhaseOptions = {
  isOpen: boolean;
  onClose: () => void;
  sheetRef: RefObject<HTMLElement | null>;
  isDesktop: boolean;
};

export function useSheetPhase({ isOpen, onClose, sheetRef, isDesktop }: UseSheetPhaseOptions) {
  const [phase, setPhase] = useState<Phase>(PHASE.idle);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const notifyClose = useEffectEvent(onClose);

  const [prevOpen, setPrevOpen] = useState(false);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (isOpen && phase === PHASE.idle) setPhase(PHASE.mounted);
    if (!isOpen && phase !== PHASE.idle && phase !== PHASE.closing) setPhase(PHASE.closing);
  }

  const isClosedByUserRef = useRef(false);

  const close = useCallback(() => {
    isClosedByUserRef.current = true;
    setPhase((current) => (current === PHASE.idle || current === PHASE.closing ? current : PHASE.closing));
  }, []);

  useLayoutEffect(() => {
    if (phase !== PHASE.mounted) return undefined;
    const focused = document.activeElement;
    previousFocusRef.current = focused instanceof HTMLElement ? focused : null;
    sheetRef.current?.getBoundingClientRect();
    const id = requestAnimationFrame(() => setPhase(PHASE.opening));
    return () => cancelAnimationFrame(id);
  }, [phase, sheetRef]);

  useEffect(() => {
    if (phase !== PHASE.opening) return undefined;
    const id = setTimeout(() => setPhase(PHASE.open), ANIMATION_MS);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== PHASE.closing) return undefined;
    overwriteDraggedStyleWithHidden(sheetRef.current, isDesktop);

    const id = setTimeout(() => {
      setPhase(PHASE.idle);
      if (!isClosedByUserRef.current) return;
      isClosedByUserRef.current = false;
      notifyClose();
      previousFocusRef.current?.focus();
    }, ANIMATION_MS);
    return () => clearTimeout(id);
  }, [phase, isDesktop, sheetRef]);

  return { phase, close };
}
