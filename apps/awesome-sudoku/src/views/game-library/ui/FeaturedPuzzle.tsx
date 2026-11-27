'use client';

import { useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu';

import { SITE_HEADLINE } from '@entities/game-catalog';
import { SLIDES, SWIPE_DISTANCE } from '@views/game-library/config/featuredSlides';
import { FeaturedSlide } from '@views/game-library/ui/featured-slide/featuredSlide';
import { FeaturedSlideContent } from '@views/game-library/ui/FeaturedSlideContent';
import styles from '@views/game-library/ui/GameLibrary.module.css';

type Step = -1 | 1;

interface FeaturedPuzzleProps {
  wallsGuide: ReactNode;
}

export function FeaturedPuzzle({ wallsGuide }: FeaturedPuzzleProps) {
  const [position, setPosition] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);

  function handleStep(step: Step): void {
    setPosition((current) => (current + step + SLIDES.length) % SLIDES.length);
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>): void {
    const point = event.touches[0];
    touch.current = point ? { x: point.clientX, y: point.clientY } : null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>): void {
    const point = event.changedTouches[0];
    const start = touch.current;
    touch.current = null;
    const hasTouch = point && start;
    if (!hasTouch) return;
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    const isSwipe = Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy);
    if (isSwipe) handleStep(dx < 0 ? 1 : -1);
  }

  return (
    <section
      className={styles.hero}
      aria-labelledby="library-title"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.heroBar}>
        <h1 id="library-title">{SITE_HEADLINE}</h1>
        <div className={styles.slideControls} role="group" aria-label="게임 넘기기">
          <button type="button" aria-label="이전 게임" onClick={() => handleStep(-1)}>
            <LuArrowLeft aria-hidden="true" />
          </button>
          <span aria-live="polite">
            {position + 1} / {SLIDES.length}
          </span>
          <button type="button" aria-label="다음 게임" onClick={() => handleStep(1)}>
            <LuArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
      {SLIDES.map((slide, index) => (
        <FeaturedSlide.Root key={slide.id} gameId={slide.id} isHidden={position !== index}>
          <div className={styles.heroCopy}>
            <h2>{slide.title}</h2>
            <p>{slide.hint}</p>
            <FeaturedSlide.GameLink />
          </div>
          <FeaturedSlideContent slide={slide} wallsGuide={wallsGuide} />
        </FeaturedSlide.Root>
      ))}
    </section>
  );
}
