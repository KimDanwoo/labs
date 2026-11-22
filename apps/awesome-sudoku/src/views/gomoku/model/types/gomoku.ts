import type { STONE } from '@views/gomoku/config/board';
import type { GAME_ACTION, OUTCOME } from '@views/gomoku/config/game';

export type Cell = (typeof STONE)[keyof typeof STONE];
export type Stone = Exclude<Cell, typeof STONE.EMPTY>;
export type Outcome = (typeof OUTCOME)[keyof typeof OUTCOME];

export interface GameState {
  moves: readonly number[];
  winLine: readonly number[] | null;
}

export type GameAction =
  | { type: typeof GAME_ACTION.PLACE; cell: number; stone: Stone }
  | { type: typeof GAME_ACTION.UNDO }
  | { type: typeof GAME_ACTION.RESET };
