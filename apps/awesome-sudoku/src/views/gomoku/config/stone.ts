import { STONE } from '@views/gomoku/config/board';
import type { Cell, Stone } from '@views/gomoku/model/types/gomoku';

export const STONE_LABEL: Record<Cell, string> = {
  [STONE.EMPTY]: '빈칸',
  [STONE.BLACK]: '흑돌',
  [STONE.WHITE]: '백돌',
};

export const FORBIDDEN_LABEL = '흑의 금수(삼삼·사사·장목)로 둘 수 없는 칸';

export const EMPTY_STONE_CLASS = 'opacity-0 group-hover:opacity-25 group-aria-disabled:group-hover:opacity-0';

export const PLACED_STONE_CLASS = 'animate-pop-in motion-reduce:animate-none';

export const STONE_CLASS: Record<Stone, string> = {
  [STONE.BLACK]: 'bg-stone-black',
  [STONE.WHITE]: 'bg-stone-white ring-1 ring-inset ring-stone-white-edge',
};

export const STONE_DOT_CLASS: Record<Stone, string> = {
  [STONE.BLACK]: 'bg-stone-black',
  [STONE.WHITE]: 'bg-white ring-[1.5px] ring-inset ring-ink/25',
};

export const LAST_MOVE_CLASS: Record<Stone, string> = {
  [STONE.BLACK]: 'bg-lemon',
  [STONE.WHITE]: 'bg-ink',
};
