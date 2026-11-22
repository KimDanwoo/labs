import { STONE } from '@views/gomoku/config/board';
import type { Cell } from '@views/gomoku/model/types/gomoku';

export const STONE_LABEL: Record<Cell, string> = {
  [STONE.EMPTY]: '빈칸',
  [STONE.BLACK]: '흑돌',
  [STONE.WHITE]: '백돌',
};

export const FORBIDDEN_LABEL = '삼삼이라 둘 수 없는 칸';

export const STONE_CLASS: Record<Cell, string> = {
  [STONE.EMPTY]: 'opacity-0 bg-neutral-900 group-hover:opacity-25 group-aria-disabled:group-hover:opacity-0',
  [STONE.BLACK]: 'bg-linear-to-br from-neutral-600 to-neutral-950 shadow-md',
  [STONE.WHITE]: 'bg-linear-to-br from-white to-neutral-300 shadow-md',
};
