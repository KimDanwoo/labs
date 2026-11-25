import { RANK_TONE } from '@views/guess-word/config/game';
import type { RankTone } from '@views/guess-word/model/types/guessWord';

export const GUESS_ROW_GRID =
  'grid grid-cols-[1.5rem_minmax(0,1fr)_3.25rem_auto] gap-2 sm:grid-cols-[2.5rem_minmax(0,1fr)_4.5rem_auto]';

export const GUESS_BUTTON_VARIANT = {
  primary:
    'bg-linear-to-b from-gradient-from to-gradient-to font-semibold text-white shadow-lg shadow-gradient-from/30 hover:brightness-110',
  secondary: 'border border-border-light bg-bg-tertiary font-normal text-text-primary hover:bg-surface-tertiary',
} as const;

export const RANK_TONE_TEXT_CLASS: Record<RankTone, string> = {
  [RANK_TONE.ANSWER]: 'text-accent-text font-semibold',
  [RANK_TONE.RANKED]: 'text-text-primary',
  [RANK_TONE.FAR]: 'text-text-tertiary',
};

export const RANK_BAR_PERCENT = 100;
