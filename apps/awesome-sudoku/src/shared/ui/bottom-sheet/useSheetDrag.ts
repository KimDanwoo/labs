'use client';

import { useRef, type PointerEvent, type RefObject } from 'react';
import { MOBILE_MOTION } from './sheetMotion';

/** 시트 높이의 이 비율보다 많이 끌어내리면 닫는다. */
const DISMISS_HEIGHT_RATIO = 0.35;
/** 이보다 빠르게(px/초) 튕기면 거리가 짧아도 닫는다. */
const DISMISS_VELOCITY = 500;
const MS_PER_SECOND = 1000;

type UseSheetDragOptions = {
  sheetRef: RefObject<HTMLElement | null>;
  isDraggable: boolean;
  onDismiss: () => void;
};

/** 손잡이를 끌어 시트를 내린다. 끄는 동안은 React를 거치지 않고 시트의 transform을 직접 옮긴다. */
export function useSheetDrag({ sheetRef, isDraggable, onDismiss }: UseSheetDragOptions) {
  const drag = useRef({ isDragging: false, startY: 0, currentY: 0, startTime: 0, sheetHeight: 0 });

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const sheet = sheetRef.current;
    if (!isDraggable || !sheet) return;

    sheet.style.transition = 'none';
    drag.current = {
      isDragging: true,
      startY: event.clientY,
      currentY: event.clientY,
      startTime: Date.now(),
      sheetHeight: sheet.offsetHeight,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const state = drag.current;
    if (!state.isDragging) return;

    state.currentY = event.clientY;
    const offset = Math.max(0, event.clientY - state.startY);
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${offset}px)`;
  };

  const handlePointerEnd = () => {
    const state = drag.current;
    if (!state.isDragging) return;
    state.isDragging = false;

    const sheet = sheetRef.current;
    if (!sheet) return;

    const distance = Math.max(0, state.currentY - state.startY);
    const velocity = (distance / (Date.now() - state.startTime)) * MS_PER_SECOND;
    const shouldDismiss = distance / state.sheetHeight > DISMISS_HEIGHT_RATIO || velocity > DISMISS_VELOCITY;

    sheet.style.transition = MOBILE_MOTION.transition;
    sheet.style.transform = (shouldDismiss ? MOBILE_MOTION.hidden : MOBILE_MOTION.shown).transform;
    if (shouldDismiss) onDismiss();
  };

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    onPointerCancel: handlePointerEnd,
  };
}
