'use client';

import { DEAL_STAGGER_MS, FLIGHT_EASING, FLIGHT_ORIGIN, FLIGHT_Z_INDEX } from '@views/gostop/config/playback';
import { flightFrames, layoutBoxWithin, type Box, type FlightPlan } from '@views/gostop/lib/flight';
import type { FlightOrigin } from '@views/gostop/model/types/playback';
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

const CARD_SELECTOR = '[data-card]';

function anchorBox(root: HTMLElement, origin: FlightOrigin): Box | null {
  const anchor = root.querySelector<HTMLElement>(`[data-anchor="${origin}"]`);
  return anchor ? layoutBoxWithin(anchor, root) : null;
}

function launch(element: HTMLElement, frames: Keyframe[], plan: FlightPlan, delay: number): void {
  element.getAnimations().forEach((animation) => animation.cancel());
  element.style.zIndex = FLIGHT_Z_INDEX;
  const animation = element.animate(frames, {
    duration: plan.durationMs,
    delay,
    easing: FLIGHT_EASING,
    fill: 'backwards',
  });
  const release = () => {
    element.style.zIndex = '';
  };
  animation.addEventListener('finish', release);
  animation.addEventListener('cancel', release);
}

function flyCards(root: HTMLElement, plan: FlightPlan | null, previous: ReadonlyMap<string, Box>): Map<string, Box> {
  const boxes = new Map<string, Box>();
  const origin = plan ? anchorBox(root, plan.isDeal ? FLIGHT_ORIGIN.DECK : plan.origin) : null;
  root.querySelectorAll<HTMLElement>(CARD_SELECTOR).forEach((element, index) => {
    const key = element.dataset.card;
    const box = layoutBoxWithin(element, root);
    if (!key) return;
    if (!box) return;
    boxes.set(key, box);
    if (!plan) return;
    const known = plan.isDeal ? undefined : previous.get(key);
    const from = known ?? origin;
    const frames = from ? flightFrames(from, box, !known) : null;
    if (!frames) return;
    launch(element, frames, plan, plan.isDeal ? index * DEAL_STAGGER_MS : 0);
  });
  return boxes;
}

export const useCardFlight = (
  rootRef: RefObject<HTMLElement | null>,
  flightKey: object | null,
  plan: FlightPlan | null,
) => {
  const boxesRef = useRef<Map<string, Box>>(new Map());
  const flownKeyRef = useRef<object | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const isNewFlight = flownKeyRef.current !== flightKey;
    flownKeyRef.current = flightKey;
    boxesRef.current = flyCards(root, isNewFlight ? plan : null, boxesRef.current);
  });

  useEffect(() => {
    const remeasure = () => {
      const root = rootRef.current;
      if (root) boxesRef.current = flyCards(root, null, boxesRef.current);
    };
    window.addEventListener('resize', remeasure);
    return () => window.removeEventListener('resize', remeasure);
  }, [rootRef]);
};
