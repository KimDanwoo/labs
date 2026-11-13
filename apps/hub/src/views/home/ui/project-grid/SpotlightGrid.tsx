'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';

import { applySpotlight, resetSpotlight } from '../../lib/spotlight';

const SPOTLIGHT_SELECTOR = '[data-spotlight]';

type SpotlightGridProps = { className: string; children: ReactNode };

export function SpotlightGrid({ className, children }: SpotlightGridProps) {
  const activeCardRef = useRef<HTMLElement | null>(null);

  function releaseActiveCard() {
    if (activeCardRef.current) resetSpotlight(activeCardRef.current);
    activeCardRef.current = null;
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return;
    const card = event.target instanceof Element ? event.target.closest<HTMLElement>(SPOTLIGHT_SELECTOR) : null;
    if (card !== activeCardRef.current) releaseActiveCard();
    if (!card) return;
    activeCardRef.current = card;
    applySpotlight(card, event.clientX, event.clientY);
  }

  return (
    <div
      className={className}
      onPointerMove={handlePointerMove}
      onPointerLeave={releaseActiveCard}
      onPointerCancel={releaseActiveCard}
    >
      {children}
    </div>
  );
}
