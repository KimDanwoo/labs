'use client';

import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

import { cn } from '@shared/lib/cn';
import { CircleButton } from '@shared/ui/circle-button';
import { SLIDES, TRIAL_TEXT } from '@views/game-library/config/featuredSlides';
import { useTrialContext } from '@views/game-library/model/hooks/useTrialContext';

export function TrialPager() {
  const { position, handleStep } = useTrialContext();

  return (
    <div className="mt-3.5 flex items-center justify-center gap-3">
      <CircleButton size="s" aria-label={TRIAL_TEXT.previous} onClick={() => handleStep(-1)}>
        <LuChevronLeft aria-hidden="true" />
      </CircleButton>
      <span aria-hidden="true" className="flex items-center gap-1.5">
        {SLIDES.map((slide, index) => (
          <span
            key={slide.id}
            className={cn(
              'h-1.5 rounded-full transition-[width,background-color] duration-200',
              position === index ? 'w-[18px] bg-primary' : 'w-1.5 bg-border-medium',
            )}
          />
        ))}
      </span>
      <span
        aria-live="polite"
        className="min-w-[34px] text-center text-[13px] font-bold text-text-tertiary tabular-nums"
      >
        {position + 1} / {SLIDES.length}
      </span>
      <CircleButton size="s" aria-label={TRIAL_TEXT.next} onClick={() => handleStep(1)}>
        <LuChevronRight aria-hidden="true" />
      </CircleButton>
    </div>
  );
}
