'use client';

import { cn } from '@shared/lib/cn';
import { SLIDES } from '@views/game-library/config/featuredSlides';
import { useTrialContext } from '@views/game-library/model/hooks/useTrialContext';
import { TrialCount } from '@views/game-library/ui/trial/TrialCount';
import { TrialStepButton } from '@views/game-library/ui/trial/TrialStepButton';

export function TrialPager() {
  const { position } = useTrialContext();

  return (
    <div className="mt-3.5 flex items-center justify-center gap-3 lg:hidden">
      <TrialStepButton step={-1} />
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
      <TrialCount />
      <TrialStepButton step={1} />
    </div>
  );
}
