'use client';

import { PillTab } from '@shared/ui/pill-tab';
import { SLIDES, TRIAL_TEXT } from '@views/game-library/config/featuredSlides';
import { trialPanelId, trialTabId } from '@views/game-library/lib/trialIds';
import { useTrialContext } from '@views/game-library/model/hooks/useTrialContext';

export function TrialTabs() {
  const { baseId, position, tablistRef, handleSelect, handleTabKeyDown } = useTrialContext();

  return (
    <div
      ref={tablistRef}
      role="tablist"
      aria-label={TRIAL_TEXT.tabsLabel}
      onKeyDown={handleTabKeyDown}
      className="relative -mx-5 mb-3 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {SLIDES.map((slide, index) => (
        <PillTab
          key={slide.id}
          id={trialTabId(baseId, slide.id)}
          aria-controls={trialPanelId(baseId, slide.id)}
          isSelected={position === index}
          onClick={() => handleSelect(index)}
        >
          {slide.title}
        </PillTab>
      ))}
    </div>
  );
}
