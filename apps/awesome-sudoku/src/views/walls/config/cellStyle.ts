import { SIDE } from '@views/walls/config/board';
import type { Side } from '@views/walls/model/types/walls';

export const SIDE_LABEL: Record<Side, string> = {
  [SIDE.ME]: '내 말',
  [SIDE.COMPUTER]: '컴퓨터 말',
};

export const EMPTY_LABEL = '빈칸';

export const TARGET_LABEL = '옮길 수 있음';

export const PAWN_CLASS: Record<Side, string> = {
  [SIDE.ME]: 'bg-lemon',
  [SIDE.COMPUTER]: 'bg-walls-cpu-pawn',
};

export const PAWN_RING_CLASS = 'scale-115 ring-4 ring-primary/30';

export const NEUTRAL_CLASS = 'bg-walls-cell';

export const LEANING_CLASS: Record<Side, string> = {
  [SIDE.ME]: 'bg-walls-me-soft',
  [SIDE.COMPUTER]: 'bg-walls-cpu-soft',
};

export const SETTLED_CLASS: Record<Side, string> = {
  [SIDE.ME]: 'bg-walls-me',
  [SIDE.COMPUTER]: 'bg-walls-cpu',
};
