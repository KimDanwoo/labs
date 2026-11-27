export type BallTone = 'yellow' | 'blue' | 'red' | 'gray' | 'green';
export type BallSize = 'sm' | 'md' | 'fill';
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
  'inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold font-tabular leading-none shadow-[inset_0_-3px_5px_rgb(0_0_0/0.18),0_1px_2px_rgb(0_0_0/0.22)]';

export const BALL_TONE_CLASS: Record<BallTone, string> = {
  yellow: 'bg-[radial-gradient(circle_at_32%_28%,#fff4bf_0%,#f8c42a_40%,#cf9600_100%)] text-[#3a2800]',
  blue: 'bg-[radial-gradient(circle_at_32%_28%,#c4e5ff_0%,#2f8ee0_42%,#145fa8_100%)] text-white [text-shadow:0_1px_1px_rgb(0_0_0/0.35)]',
  red: 'bg-[radial-gradient(circle_at_32%_28%,#ffcdca_0%,#e5484d_42%,#ad222b_100%)] text-white [text-shadow:0_1px_1px_rgb(0_0_0/0.35)]',
  gray: 'bg-[radial-gradient(circle_at_32%_28%,#e6e7ec_0%,#858893_42%,#565862_100%)] text-white [text-shadow:0_1px_1px_rgb(0_0_0/0.35)]',
  green: 'bg-[radial-gradient(circle_at_32%_28%,#e4f8c6_0%,#7cc243_42%,#4b8a1f_100%)] text-[#132a05]',
};

export const BALL_SIZE_CLASS: Record<BallSize, string> = {
  sm: 'size-8 text-sm',
  md: 'size-9 text-[15px] sm:size-11 sm:text-lg',
  fill: 'size-full text-[15px] sm:text-base',
};

export const BALL_EMPHASIS_CLASS: Record<BallEmphasis, string> = {
  plain: '',
  matched: 'ring-2 ring-text-primary ring-offset-2 ring-offset-surface-primary',
  muted: 'opacity-60',
};

export const BALL_REVEAL_CLASS = 'motion-safe:animate-[lotto-ball-drop_520ms_cubic-bezier(0.34,1.56,0.64,1)_both]';
export const VERDICT_REVEAL_CLASS = 'motion-safe:animate-[lotto-fade-up_320ms_ease-out_both]';

export const LOTTO_BUTTON_VARIANT = {
  primary:
    'bg-linear-to-b from-gradient-from to-gradient-to font-semibold text-white shadow-lg shadow-gradient-from/30 hover:brightness-110 disabled:shadow-none',
  secondary: 'border border-border-light bg-bg-tertiary font-normal text-text-primary hover:bg-surface-tertiary',
  stop: 'border border-border-light bg-bg-tertiary font-semibold text-error-text hover:bg-surface-tertiary',
} as const;

export const LOTTO_BUTTON_SIZE = {
  md: 'h-12 px-5 text-base',
  sm: 'h-10 px-4 text-sm',
} as const;

export const NUMBER_TOGGLE_CLASS =
  'flex aspect-square items-center justify-center rounded-full text-[15px] font-tabular transition-all duration-150 ease-out active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-30 sm:text-base';

export const NUMBER_TOGGLE_IDLE_CLASS =
  'border border-border-light bg-bg-tertiary/60 text-text-secondary hover:border-border-medium hover:text-text-primary';

export const STAT_TONE_CLASS: Record<StatTone, string> = {
  plain: 'text-text-primary',
  gain: 'text-hint-text',
  loss: 'text-error-text',
};

export const TABLE_HEAD_CELL_CLASS = 'py-2 text-xs font-normal text-text-tertiary';
export const TABLE_CELL_CLASS = 'py-2.5 text-sm font-tabular text-text-primary';
