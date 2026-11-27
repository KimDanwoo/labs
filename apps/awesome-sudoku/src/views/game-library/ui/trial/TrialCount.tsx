'use client';

import { SLIDES } from '@views/game-library/config/featuredSlides';
import { useTrialContext } from '@views/game-library/model/hooks/useTrialContext';

export function TrialCount() {
  const { position } = useTrialContext();

  return (
    <span aria-live="polite" className="min-w-[34px] text-center text-[13px] font-bold text-text-tertiary tabular-nums">
      {position + 1} / {SLIDES.length}
    </span>
  );
}
