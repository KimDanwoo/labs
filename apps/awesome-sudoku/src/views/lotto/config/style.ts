export type BallTone = 'yellow' | 'blue' | 'red' | 'gray' | 'green';
export type BallSize = 'tray' | 'fill';
export type BallEmphasis = 'plain' | 'matched' | 'muted';
export type StatTone = 'plain' | 'gain' | 'loss';

export const BALL_TONE_CEILINGS: readonly { ceiling: number; tone: BallTone }[] = [
  { ceiling: 10, tone: 'yellow' },
  { ceiling: 20, tone: 'blue' },
  { ceiling: 30, tone: 'red' },
  { ceiling: 40, tone: 'gray' },
  { ceiling: 45, tone: 'green' },
];

export const BALL_BASE_CLASS =
  'inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold font-tabular leading-none transition-opacity duration-300';

export const BALL_TONE_CLASS: Record<BallTone, string> = {
  yellow: 'bg-lemon text-ink',
  blue: 'bg-[#2b66d9] text-white',
  red: 'bg-[#d6343a] text-white',
  gray: 'bg-[#4e5968] text-white dark:bg-[#6b7684]',
  green: 'bg-[#3ac47d] text-ink',
};

export const BALL_SIZE_CLASS: Record<BallSize, string> = {
  tray: 'size-[34px] text-[15px] sm:size-12 sm:text-lg short-landscape:size-[34px] short-landscape:text-[15px]',
  fill: 'size-[84%] text-[15px] sm:text-[17px]',
};

export const BALL_EMPHASIS_CLASS: Record<BallEmphasis, string> = {
  plain: '',
  matched: '',
  muted: 'bg-weak text-on-weak dark:bg-weak',
};

export const BALL_ROLL_IN_CLASS = 'motion-safe:animate-[lotto-roll-in_560ms_cubic-bezier(0.34,1.4,0.64,1)_both]';
export const BALL_POP_CLASS = 'motion-safe:animate-[lotto-pop_260ms_cubic-bezier(0.34,1.56,0.64,1)_both]';
export const VERDICT_REVEAL_CLASS = '[grid-area:1/1] motion-safe:animate-[lotto-fade-in_280ms_ease-out_both]';
export const DRAWING_TEXT_CLASS =
  'hidden [grid-area:1/1] motion-safe:inline motion-safe:animate-[lotto-fade-out_160ms_ease-in_both]';
export const PROGRESS_SWEEP_CLASS = 'motion-safe:animate-[lotto-sweep_1.4s_ease-in-out_infinite]';

export const BULK_PANEL_CLASS =
  'fixed inset-x-4 top-auto bottom-6 m-0 mx-auto w-auto max-w-md rounded-3xl border-0 bg-surface-elevated p-6 text-text-primary opacity-0 translate-y-3 transition-[opacity,translate,display,overlay] transition-discrete duration-200 ease-out open:opacity-100 open:translate-y-0 starting:open:opacity-0 starting:open:translate-y-3 backdrop:bg-black/50 sm:top-0 sm:bottom-0 sm:my-auto sm:h-fit';

export const EMPTY_SLOT_CLASS =
  'inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-weak text-text-tertiary sm:size-12 short-landscape:size-[34px]';

export const NUMBER_CELL_CLASS =
  'group flex aspect-square w-full items-center justify-center rounded-full transition-transform duration-150 ease-out active:scale-90 focus-visible:outline-none disabled:cursor-not-allowed disabled:active:scale-100';

export const NUMBER_DISC_CLASS =
  'flex size-[84%] items-center justify-center rounded-full bg-surface-primary text-[15px] font-semibold dark:bg-border-medium font-tabular text-text-secondary transition-colors duration-150 group-hover:bg-lemon-soft group-hover:text-text-primary group-disabled:opacity-30 sm:text-[17px]';

export const NUMBER_FOCUS_CLASS =
  'group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-face';

export const TILE_CLASS = 'rounded-2xl bg-weak';

export const STAT_TONE_CLASS: Record<StatTone, string> = {
  plain: 'text-text-primary',
  gain: 'text-hint-text',
  loss: 'text-error-text',
};

export const TABLE_HEAD_CELL_CLASS = 'pb-2 text-xs font-normal text-text-tertiary';
export const TABLE_CELL_CLASS = 'py-2.5 text-sm font-tabular text-text-primary';

export const LOTTO_BOARD_SIZE = 'short-landscape:max-w-[calc((100svh-6rem)*1.25)]';
