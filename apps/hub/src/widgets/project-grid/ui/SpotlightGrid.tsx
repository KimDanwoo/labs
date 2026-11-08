'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';

import { applySpotlight, resetSpotlight } from '@widgets/project-grid/lib/spotlight';

const SPOTLIGHT_SELECTOR = '[data-spotlight]';

type SpotlightGridProps = { className: string; children: ReactNode };

/** 카드마다 리스너를 달지 않고 그리드 하나에서 포인터를 받아 현재 카드에만 효과를 준다. */
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
