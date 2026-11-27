import { LOTTO_MAX_NUMBER } from '@views/lotto/config/lotto';

export const LOTTO_NUMBERS: readonly number[] = Array.from({ length: LOTTO_MAX_NUMBER }, (_, index) => index + 1);

export const BALL_REVEAL_STEP_MS = 380;
export const WEEKLY_TICKETS = 5;
export const WEEKS_PER_YEAR = 52;
export const PERCENT = 100;
export const EMPTY_VALUE = '—';
