'use client';

import { TRIAL_TEXT } from '@views/game-library/config/featuredSlides';
import { useTrialContext } from '@views/game-library/model/hooks/useTrialContext';

export function TrialHeading() {
  const { baseId } = useTrialContext();

  return (
    <div className="mb-3.5">
      <h2 id={`${baseId}-title`} className="text-xl leading-[1.45] font-extrabold tracking-[-0.03em]">
        {TRIAL_TEXT.title}
      </h2>
      <p className="mt-0.5 text-sm text-text-tertiary">{TRIAL_TEXT.description}</p>
    </div>
  );
}
