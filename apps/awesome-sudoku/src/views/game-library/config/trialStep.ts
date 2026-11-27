import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

import { TRIAL_TEXT } from '@views/game-library/config/featuredSlides';

export const TRIAL_STEP_VIEW = {
  [-1]: { label: TRIAL_TEXT.previous, Icon: LuChevronLeft },
  1: { label: TRIAL_TEXT.next, Icon: LuChevronRight },
} as const;
