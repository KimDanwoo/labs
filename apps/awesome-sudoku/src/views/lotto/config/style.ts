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
  'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold font-tabular leading-none shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_-1px_0_rgb(0_0_0/0.08)] transition-opacity duration-300';

export const BALL_TONE_CLASS: Record<BallTone, string> = {
  yellow: 'bg-[#f5c242] text-[#3d2c00]',
  blue: 'bg-[#2b78d0] text-white',
  red: 'bg-[#dc4146] text-white',
  gray: 'bg-[#73767f] text-white',
  green: 'bg-[#4fb05a] text-[#0b2a10]',
};

export const BALL_SIZE_CLASS: Record<BallSize, string> = {
  tray: 'size-[34px] text-[15px] sm:size-12 sm:text-lg',
  fill: 'size-[84%] text-[15px] sm:text-[17px]',
};

export const BALL_EMPHASIS_CLASS: Record<BallEmphasis, string> = {
  plain: '',
  matched: '',
  muted: 'opacity-30 saturate-50',
};

export const BALL_ROLL_IN_CLASS = 'motion-safe:animate-[lotto-roll-in_560ms_cubic-bezier(0.34,1.4,0.64,1)_both]';
export const BALL_POP_CLASS = 'motion-safe:animate-[lotto-pop_260ms_cubic-bezier(0.34,1.56,0.64,1)_both]';
export const VERDICT_REVEAL_CLASS = '[grid-area:1/1] motion-safe:animate-[lotto-fade-in_280ms_ease-out_both]';
export const DRAWING_TEXT_CLASS =
  'hidden [grid-area:1/1] motion-safe:inline motion-safe:animate-[lotto-fade-out_160ms_ease-in_both]';
export const PROGRESS_SWEEP_CLASS = 'motion-safe:animate-[lotto-sweep_1.4s_ease-in-out_infinite]';

const GLASS_FROST =
  'bg-surface-primary supports-[backdrop-filter:blur(0)]:bg-glass/55 supports-[backdrop-filter:blur(0)]:backdrop-blur-2xl supports-[backdrop-filter:blur(0)]:backdrop-saturate-[1.8]';

export const GLASS_EDGE_CLASS =
  'ring-1 ring-black/6 shadow-[inset_0_1px_0_rgb(255_255_255/0.8),0_1px_1px_rgb(0_0_0/0.03),0_12px_32px_-14px_rgb(15_23_42/0.2)] dark:ring-white/9 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_12px_32px_-14px_rgb(0_0_0/0.7)]';

export const GLASS_CLASS = `${GLASS_FROST} ${GLASS_EDGE_CLASS}`;

export const GLASS_PANE_CLASS =
  'bg-surface-primary supports-[backdrop-filter:blur(0)]:bg-glass/40 supports-[backdrop-filter:blur(0)]:backdrop-blur-3xl supports-[backdrop-filter:blur(0)]:backdrop-saturate-[1.6] dark:supports-[backdrop-filter:blur(0)]:bg-glass/60';

export const GLASS_LENS_CLASS =
  'bg-white/70 ring-1 ring-black/5 shadow-[inset_0_1px_0_rgb(255_255_255/0.9),inset_0_-1px_2px_rgb(0_0_0/0.03)] dark:bg-white/6 dark:ring-white/8 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.07)]';

export const BULK_PANEL_CLASS =
  'fixed inset-x-4 top-auto bottom-6 m-0 mx-auto w-auto max-w-sm rounded-3xl border-0 p-4 text-text-primary opacity-0 translate-y-3 transition-[opacity,translate,display,overlay] transition-discrete duration-200 ease-out open:opacity-100 open:translate-y-0 starting:open:opacity-0 starting:open:translate-y-3 backdrop:bg-black/25 sm:top-0 sm:bottom-0 sm:my-auto sm:h-fit';

export const GLASS_SHEET_CLASS =
  'bg-surface-primary supports-[backdrop-filter:blur(0)]:bg-glass/75 supports-[backdrop-filter:blur(0)]:backdrop-blur-2xl supports-[backdrop-filter:blur(0)]:backdrop-saturate-[1.8] ring-1 ring-black/6 dark:ring-white/9';

export const AMBIENT_GLOW_CLASS =
  'pointer-events-none absolute inset-x-4 inset-y-8 -z-10 opacity-60 blur-3xl dark:opacity-45 bg-[radial-gradient(closest-side_at_18%_20%,#fcd34d,transparent),radial-gradient(closest-side_at_84%_28%,#60a5fa,transparent),radial-gradient(closest-side_at_26%_82%,#fb7185,transparent),radial-gradient(closest-side_at_80%_80%,#4ade80,transparent)]';

export const EMPTY_SLOT_CLASS =
  'inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-black/5 text-text-tertiary shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)] sm:size-12 dark:bg-white/6 dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)]';

export const NUMBER_CELL_CLASS =
  'group flex aspect-square w-full items-center justify-center rounded-full transition-transform duration-150 ease-out active:scale-90 focus-visible:outline-none disabled:cursor-not-allowed disabled:active:scale-100';

export const NUMBER_DISC_CLASS =
  'flex size-[84%] items-center justify-center rounded-full bg-black/4 text-[15px] font-medium font-tabular text-text-secondary transition-colors duration-150 group-hover:bg-black/8 group-hover:text-text-primary group-disabled:opacity-30 sm:text-[17px] dark:bg-white/6 dark:group-hover:bg-white/12';

export const NUMBER_FOCUS_CLASS =
  'group-focus-visible:ring-2 group-focus-visible:ring-accent/70 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-transparent';

export const GLASS_BUTTON_CLASS =
  'transition-[background-color,transform] duration-200 ease-out hover:bg-glass/80 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40';

export const STAT_TONE_CLASS: Record<StatTone, string> = {
  plain: 'text-text-primary',
  gain: 'text-hint-text',
  loss: 'text-error-text',
};

export const TABLE_HEAD_CELL_CLASS = 'pb-2 text-xs font-normal text-text-tertiary';
export const TABLE_CELL_CLASS = 'py-2.5 text-sm font-tabular text-text-primary';
