import { SIDE } from '@views/walls/config/board';
import type { Side } from '@views/walls/model/types/walls';

export const SIDE_LABEL: Record<Side, string> = {
  [SIDE.ME]: '내 말',
  [SIDE.COMPUTER]: '컴퓨터 말',
};

export const EMPTY_LABEL = '빈칸';

export const TARGET_LABEL = '옮길 수 있음';

export const PAWN_CLASS: Record<Side, string> = {
  [SIDE.ME]: 'bg-linear-to-br from-blue-400 to-blue-700',
  [SIDE.COMPUTER]: 'bg-linear-to-br from-rose-400 to-rose-700',
};

export const PAWN_RING_CLASS = 'scale-115 ring-4 ring-white/70';

export const NEUTRAL_CLASS = 'bg-white/30';

export const LEANING_CLASS: Record<Side, string> = {
  [SIDE.ME]: 'bg-sky-200/85',
  [SIDE.COMPUTER]: 'bg-rose-200/85',
};

export const SETTLED_CLASS: Record<Side, string> = {
  [SIDE.ME]: 'bg-sky-400',
  [SIDE.COMPUTER]: 'bg-rose-400',
};
