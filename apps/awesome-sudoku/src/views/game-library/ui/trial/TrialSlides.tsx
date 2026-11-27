'use client';

import { SLIDES } from '@views/game-library/config/featuredSlides';
import { useTrialContext } from '@views/game-library/model/hooks/useTrialContext';
import { FeaturedSlide } from '@views/game-library/ui/featured-slide/featuredSlide';

export function TrialSlides() {
  const { position, handleTouchStart, handleTouchEnd } = useTrialContext();

  return (
    <div className="touch-pan-y" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {SLIDES.map((slide, index) => (
        <FeaturedSlide.Root key={slide.id} slide={slide} isHidden={position !== index}>
          <FeaturedSlide.Head />
          <FeaturedSlide.Play />
          <FeaturedSlide.Pager />
          <FeaturedSlide.GameLink />
        </FeaturedSlide.Root>
      ))}
    </div>
  );
}
