import { STEP_NOTE, STEP_TEXT } from '@views/walls/config/copy';
import type { Step } from '@views/walls/model/types/walls';

export const fullStepText = (step: Step): string => {
  const note = STEP_NOTE[step];
  if (!note) return STEP_TEXT[step];
  return `${STEP_TEXT[step]} (${note})`;
};
