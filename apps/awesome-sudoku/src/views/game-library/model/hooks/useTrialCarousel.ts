'use client';

import { useId, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';

import { SLIDES, SWIPE_DISTANCE } from '@views/game-library/config/featuredSlides';
import {
  centeredScrollLeft,
  keyToPosition,
  stepPosition,
  swipeStep,
  type TrialStep,
} from '@views/game-library/lib/trialNavigation';

interface Point {
  x: number;
  y: number;
}

function findTab(tablist: HTMLElement | null, index: number): HTMLElement | null {
  const tab = tablist?.children[index];
  return tab instanceof HTMLElement ? tab : null;
}

function revealTab(tablist: HTMLElement | null, tab: HTMLElement | null): void {
  const canScroll = tablist !== null && tab !== null;
  if (!canScroll) return;
  tablist.scrollTo({
    left: centeredScrollLeft(tab.offsetLeft, tab.offsetWidth, tablist.clientWidth),
    behavior: 'smooth',
  });
}

export function useTrialCarousel() {
  const baseId = useId();
  const [position, setPosition] = useState(0);
  const touchStart = useRef<Point | null>(null);
  const tablistRef = useRef<HTMLDivElement>(null);

  function handleSelect(next: number): void {
    setPosition(next);
    revealTab(tablistRef.current, findTab(tablistRef.current, next));
  }

  function handleStep(step: TrialStep): void {
    handleSelect(stepPosition(position, step, SLIDES.length));
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const next = keyToPosition(event.key, position, SLIDES.length);
    if (next === null) return;
    event.preventDefault();
    handleSelect(next);
    findTab(tablistRef.current, next)?.focus();
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>): void {
    const point = event.touches[0];
    touchStart.current = point ? { x: point.clientX, y: point.clientY } : null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>): void {
    const point = event.changedTouches[0];
    const start = touchStart.current;
    touchStart.current = null;
    const hasTouch = point !== undefined && start !== null;
    if (!hasTouch) return;
    const step = swipeStep(start, { x: point.clientX, y: point.clientY }, SWIPE_DISTANCE);
    if (step) handleStep(step);
  }

  return {
    baseId,
    position,
    tablistRef,
    handleSelect,
    handleStep,
    handleTabKeyDown,
    handleTouchStart,
    handleTouchEnd,
  };
}
