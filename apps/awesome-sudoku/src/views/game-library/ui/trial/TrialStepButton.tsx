'use client';

import type { RovingStep } from '@shared/lib/rovingIndex';
import { CircleButton } from '@shared/ui/circle-button';
import { TRIAL_STEP_VIEW } from '@views/game-library/config/trialStep';
import { useTrialContext } from '@views/game-library/model/hooks/useTrialContext';

interface TrialStepButtonProps {
  step: RovingStep;
}

export function TrialStepButton({ step }: TrialStepButtonProps) {
  const { handleStep } = useTrialContext();
  const { label, Icon } = TRIAL_STEP_VIEW[step];

  return (
    <CircleButton size="s" aria-label={label} onClick={() => handleStep(step)}>
      <Icon aria-hidden="true" />
    </CircleButton>
  );
}
