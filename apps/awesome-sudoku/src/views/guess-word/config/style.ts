import { RANK_TONE } from '@views/guess-word/config/game';
import type { RankTone } from '@views/guess-word/model/types/guessWord';

export const GUESS_ROW_GRID =
  'grid grid-cols-[1.5rem_minmax(0,1fr)_3.25rem_auto] gap-2 sm:grid-cols-[2.5rem_minmax(0,1fr)_4.5rem_auto] short-landscape:grid-cols-[1.5rem_minmax(0,1fr)_3.25rem_auto]';

export const RANK_TEXT_WIDTH = 'w-16 sm:w-[4.5rem] short-landscape:w-16';

export const RANK_BAR_WIDTH = 'w-10 sm:w-20 short-landscape:w-10';

export const GUESS_BOARD_SHAPE = 'aspect-[6/7] lg:aspect-square short-landscape:aspect-square';

export const LATEST_IN_LIST_CLASS = 'bg-surface-primary dark:bg-border-medium';

export const RANK_TONE_TEXT_CLASS: Record<RankTone, string> = {
  [RANK_TONE.ANSWER]: 'text-accent-text font-semibold',
  [RANK_TONE.RANKED]: 'text-text-primary',
  [RANK_TONE.FAR]: 'text-text-tertiary',
};

export const RANK_BAR_PERCENT = 100;
