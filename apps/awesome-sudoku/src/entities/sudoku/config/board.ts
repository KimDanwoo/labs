export const BOARD_SIZE = 9;
export const BLOCK_SIZE = 3;
export const KEY_NUMBER = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const NUMBER_COUNTS = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
export const BOARD_MAX_INDEX = BOARD_SIZE - 1;
export const BLOCKS_PER_ROW = BOARD_SIZE / BLOCK_SIZE;
export const SUDOKU_CELL_COUNT = 81;

export const DEFAULT_CELL_SIZE = 40;

export const EMPTY_HIGHLIGHT = { selected: false, related: false, sameValue: false } as const;

export const KEYBOARD_IGNORED_TARGETS = 'input, textarea, select, [contenteditable="true"], [role="dialog"]';

export const CELL_FOCUS_RING = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent';

export const BOARD_RADIUS = 'rounded-[12px]';

export const BOARD_FRAME = `@container relative w-full overflow-hidden ${BOARD_RADIUS} border-2 border-text-tertiary bg-surface-primary`;

export const BOARD_TABLE =
  'w-full table-fixed border-collapse bg-surface-primary [&_tr:first-child>td]:border-t-0 [&_tr:last-child>td]:border-b-0 [&_td:first-child]:border-l-0 [&_td:last-child]:border-r-0';

export const CELL_SIZE = 'h-[calc(100cqw/9)]';

export const CELL_VALUE_TEXT = 'text-[calc(100cqw/9*0.46)] leading-none';

export const CELL_VALUE_BELOW_CAGE_LABEL = 'inline-block translate-y-[calc(100cqw/9*0.14)]';

export const BOARD_COLUMN = `relative isolate overflow-hidden ${BOARD_RADIUS}`;

export const CELL_NOTE_TEXT = 'text-[max(9px,calc(100cqw/9*0.22))] leading-none';

export const PANEL_GRID = {
  tools: 'grid grid-cols-6 gap-2 lg:gap-3',
  keypad: 'grid grid-cols-9 gap-2 lg:grid-cols-3 lg:gap-3',
} as const;

export const NUMBER_BUTTON =
  'flex h-14 w-full min-w-0 cursor-pointer items-center justify-center rounded-xl bg-weak text-[22px] font-semibold text-text-primary tabular-nums transition-[transform,background-color,opacity] duration-150 ease-out hover:bg-border-light active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100 lg:h-auto lg:aspect-[8/5] lg:rounded-2xl lg:text-3xl';

export const PAUSE_OVERLAY = {
  root: `absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 ${BOARD_RADIUS} border-2 border-text-tertiary bg-surface-primary transition-opacity duration-200 ease-out starting:opacity-0 motion-reduce:transition-none`,
  resume:
    'flex flex-col items-center gap-4 rounded-3xl p-8 transition-transform duration-200 ease-out hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100',
} as const;

export const BLOCK_LINE = {
  right: 'border-r-2 border-r-text-tertiary',
  bottom: 'border-b-2 border-b-text-tertiary',
} as const;
