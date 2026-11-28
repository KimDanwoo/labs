import { CUT_IN_MS } from '@views/gostop/config/playback';
import type { CutIn, PlaybackStep } from '@views/gostop/model/types/playback';
import { useEffect, useState } from 'react';

export interface ShownCutIn extends CutIn {
  id: number;
}

export const useCutIn = (step: PlaybackStep | null): ShownCutIn | null => {
  const [seenStep, setSeenStep] = useState(step);
  const [shown, setShown] = useState<ShownCutIn | null>(null);

  if (seenStep !== step) {
    setSeenStep(step);
    if (step?.cutIn) setShown({ ...step.cutIn, id: (shown?.id ?? 0) + 1 });
  }

  useEffect(() => {
    if (!shown) return undefined;
    const timer = setTimeout(() => setShown(null), CUT_IN_MS);
    return () => clearTimeout(timer);
  }, [shown]);

  return shown;
};
