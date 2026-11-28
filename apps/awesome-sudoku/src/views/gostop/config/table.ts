import { MONTH_COUNT } from '@views/gostop/config/cards';
import { SETTINGS_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { SPEED } from '@views/gostop/config/playback';
import type { Side } from '@views/gostop/model/types/gostop';

export const MONTHS = Array.from({ length: MONTH_COUNT }, (_, index) => index + 1);

export const FLOOR_CELL: Record<number, string> = {
  1: 'col-start-1 row-start-1',
  2: 'col-start-2 row-start-1',
  3: 'col-start-3 row-start-1',
  4: 'col-start-5 row-start-1',
  5: 'col-start-6 row-start-1',
  6: 'col-start-7 row-start-1',
  7: 'col-start-1 row-start-2',
  8: 'col-start-2 row-start-2',
  9: 'col-start-3 row-start-2',
  10: 'col-start-5 row-start-2',
  11: 'col-start-6 row-start-2',
  12: 'col-start-7 row-start-2',
};

export const DECK_CELL = 'col-start-4 row-span-2 row-start-1 self-center';

export const DECK_BACK_LAYERS = [
  'translate-x-1 -translate-y-1',
  'translate-x-0.5 -translate-y-0.5',
  'translate-0',
] as const;

export const CAPTURED_CARD: Record<Side, string> = {
  [SIDE.ME]: 'w-6 lg:w-7',
  [SIDE.COMPUTER]: 'w-[18px] lg:w-[22px]',
};

export const CAPTURED_PILE_HEIGHT: Record<Side, string> = {
  [SIDE.ME]: 'h-9 lg:h-[42px]',
  [SIDE.COMPUTER]: 'h-[27px] lg:h-[33px]',
};

export const CAPTURED_SLOT: Record<Side, string> = {
  [SIDE.ME]: 'basis-6 lg:basis-7',
  [SIDE.COMPUTER]: 'basis-[18px] lg:basis-[22px]',
};

export const RISK_CHIP =
  'inline-flex h-6 items-center rounded-full bg-hwatu-red/15 px-2 text-[12px] font-bold text-[rgb(255,160,170)] ring-1 ring-hwatu-red/60';

export const CUT_IN_TONE = {
  mine: 'bg-lemon text-ink shadow-[0_0_0_3px_rgb(var(--rgb-ink)),0_0_0_5px_rgb(var(--rgb-lemon)),0_18px_40px_rgb(0_0_0/0.5)]',
  rival:
    'bg-[rgb(200,32,50)] text-white shadow-[0_0_0_3px_rgb(var(--rgb-ink)),0_0_0_5px_rgb(200,32,50),0_18px_40px_rgb(0_0_0/0.5)]',
} as const;

export const SIDE_NAME_CLASS = 'text-[13px] font-bold text-white/85';

export const RECORD_FIELDS = ['played', 'wins', 'losses', 'draws', 'streak', 'bestPoints'] as const;

export const SPEED_OPTIONS = [
  { value: SPEED.NORMAL, label: SETTINGS_COPY.speedNormal },
  { value: SPEED.FAST, label: SETTINGS_COPY.speedFast },
] as const;
