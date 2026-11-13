'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { ANIMATION_MS, PHASE, sheetMotion, type Phase } from './sheetMotion';

type UseSheetPhaseOptions = {
  isOpen: boolean;
  onClose: () => void;
  sheetRef: RefObject<HTMLElement | null>;
  isDesktop: boolean;
};

export function useSheetPhase({ isOpen, onClose, sheetRef, isDesktop }: UseSheetPhaseOptions) {
  const [phase, setPhase] = useState<Phase>(PHASE.idle);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const [prevOpen, setPrevOpen] = useState(false);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (isOpen && phase === PHASE.idle) setPhase(PHASE.mounted);
    if (!isOpen && phase !== PHASE.idle && phase !== PHASE.closing) setPhase(PHASE.closing);
  }

  /** 사용자가 닫은 경우에만 onClose를 통지 — 부모가 isOpen=false로 내려 닫힌 경우 통지하면 무한 루프/상태 오염 */
  const closedByUserRef = useRef(false);

  const close = useCallback(() => {
    closedByUserRef.current = true;
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

  // closing: 드래그가 DOM에 직접 써 둔 스타일은 React가 모르므로, 닫힘 스타일을 직접 다시 쓴 뒤 애니메이션 후 unmount
  useEffect(() => {
    if (phase !== PHASE.closing) return undefined;
    const motion = sheetMotion(isDesktop);
    if (sheetRef.current) Object.assign(sheetRef.current.style, { transition: motion.transition, ...motion.hidden });

    const id = setTimeout(() => {
      setPhase(PHASE.idle);
      if (!closedByUserRef.current) return;
      closedByUserRef.current = false;
      onCloseRef.current();
      previousFocusRef.current?.focus();
    }, ANIMATION_MS);
    return () => clearTimeout(id);
  }, [phase, isDesktop, sheetRef]);

  return { phase, close };
}
