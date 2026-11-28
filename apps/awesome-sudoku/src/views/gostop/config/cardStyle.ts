import { CARD_KIND } from '@views/gostop/config/cards';
import type { CardKind } from '@views/gostop/model/types/gostop';
import type { CardMark, HandCardState } from '@views/gostop/model/types/view';

export const HWATU_IMAGE = {
  width: 240,
  height: 360,
  sizes: '(min-width: 1024px) 96px, 72px',
  back: '/hwatu/back.webp',
  monthPrefix: '/hwatu/month-',
  extension: '.webp',
} as const;

export const MONTH_DIGITS = 2;

export const CARD_FACE =
  '@container relative block aspect-[2/3] w-full overflow-hidden rounded-[5px] bg-white shadow-[0_1px_3px_rgb(0_0_0/0.28)] ring-1 ring-black/10';

export const CARD_BACK =
  'relative block aspect-[2/3] w-full overflow-hidden rounded-[4px] shadow-[0_1px_2px_rgb(0_0_0/0.3)] ring-1 ring-white/55';

export const MONTH_TAG =
  'absolute top-[5cqw] left-[5cqw] min-w-[max(15px,26cqw)] rounded-[max(3px,5cqw)] bg-ink/80 px-[4cqw] py-[3cqw] text-center text-[max(12px,19cqw)] leading-none font-bold text-white tabular-nums';

export const MARK_BADGE: Partial<Record<CardMark, string>> = {
  gwang:
    'absolute top-[4cqw] right-[4cqw] grid size-[max(18px,42cqw)] place-items-center rounded-full bg-hwatu-red text-[max(12px,23cqw)] leading-none font-black text-white shadow-[0_1px_2px_rgb(0_0_0/0.4)] ring-[3cqw] ring-white/90',
  rainGwang:
    'absolute top-[4cqw] right-[4cqw] grid size-[max(18px,42cqw)] place-items-center rounded-full bg-hwatu-red text-[max(12px,23cqw)] leading-none font-black text-white shadow-[0_1px_2px_rgb(0_0_0/0.4)] ring-[3cqw] ring-white/90',
  yeol: 'absolute top-[4cqw] right-[4cqw] grid size-[max(17px,38cqw)] place-items-center rounded-full bg-lemon text-[max(12px,21cqw)] leading-none font-black text-ink shadow-[0_1px_2px_rgb(0_0_0/0.4)] ring-[3cqw] ring-white/90',
  godori:
    'absolute top-[4cqw] right-[4cqw] grid size-[38cqw] place-items-center rounded-full bg-hwatu-blue text-white shadow-[0_1px_2px_rgb(0_0_0/0.4)] ring-[3cqw] ring-white/90 [&_svg]:size-[24cqw]',
  ssangPi:
    'absolute right-[4cqw] bottom-[4cqw] rounded-[6cqw] bg-ink px-[6cqw] py-[4cqw] text-[max(12px,21cqw)] leading-none font-black text-white shadow-[0_1px_2px_rgb(0_0_0/0.4)]',
};

export const MARK_RIBBON: Partial<Record<CardMark, string>> = {
  hong: 'absolute top-[34cqw] left-1/2 grid h-[76cqw] w-[max(14px,28cqw)] -translate-x-1/2 place-items-center rounded-[4cqw] bg-hwatu-red text-[max(12px,17cqw)] leading-none font-black tracking-[-0.06em] text-white shadow-[0_1px_3px_rgb(0_0_0/0.35)] [writing-mode:vertical-rl]',
  cheong:
    'absolute top-[34cqw] left-1/2 grid h-[76cqw] w-[max(14px,28cqw)] -translate-x-1/2 place-items-center rounded-[4cqw] bg-hwatu-blue text-[max(12px,17cqw)] leading-none font-black tracking-[-0.06em] text-white shadow-[0_1px_3px_rgb(0_0_0/0.35)] [writing-mode:vertical-rl]',
  cho: 'absolute top-[34cqw] left-1/2 h-[76cqw] w-[28cqw] -translate-x-1/2 rounded-[4cqw] bg-hwatu-red shadow-[0_1px_3px_rgb(0_0_0/0.35)]',
  plain:
    'absolute top-[34cqw] left-1/2 h-[76cqw] w-[28cqw] -translate-x-1/2 rounded-[4cqw] bg-hwatu-gray shadow-[0_1px_3px_rgb(0_0_0/0.35)]',
};

export const MARK_TEXT: Partial<Record<CardMark, string>> = {
  gwang: '광',
  rainGwang: '광',
  yeol: '열',
  ssangPi: '×2',
  hong: '홍단',
  cheong: '청단',
};

export const HAND_LIST =
  'mx-auto flex min-h-[170px] max-w-[300px] flex-wrap content-start justify-center gap-x-2.5 gap-y-1.5 pt-2 lg:min-h-[106px] lg:max-w-none lg:flex-nowrap lg:gap-1';

export const HAND_SLOT = 'relative w-[52px] shrink-0 lg:w-[65px] lg:min-w-0 lg:shrink';

export const HAND_CARD_BASE =
  'block w-full cursor-pointer rounded-[5px] transition-[translate,opacity,filter,box-shadow] duration-200 ease-snappy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-disabled:cursor-default';

export const HAND_CARD_STATE: Record<HandCardState, string> = {
  match: '-translate-y-2 shadow-[0_0_0_3px_rgb(var(--rgb-lemon)),0_8px_16px_rgb(0_0_0/0.28)] hover:-translate-y-3',
  open: 'hover:-translate-y-1',
  waiting: 'translate-y-1.5',
};

export const CAPTURE_KINDS: readonly CardKind[] = [CARD_KIND.GWANG, CARD_KIND.YEOL, CARD_KIND.TTI, CARD_KIND.PI];

export const RIVAL_BACKS_MAX = 10;
