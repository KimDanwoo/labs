import type { SIDE } from '@views/walls/config/board';
import type { GAME_ACTION, OUTCOME, STEP } from '@views/walls/config/game';

export type Side = (typeof SIDE)[keyof typeof SIDE];
export type Owner = Side | null;
export type Outcome = (typeof OUTCOME)[keyof typeof OUTCOME];
export type Step = (typeof STEP)[keyof typeof STEP];

export interface Move {
  pawn: number;
  to: number;
  edge: number;
}

export interface Board {
  pawns: number[];
  walls: Uint8Array;
}

export interface Selection {
  pawn: number | null;
  target: number | null;
}

export interface Territory {
  owners: Owner[];
  settled: boolean[];
  scores: Record<Side, number>;
  isOver: boolean;
}

export interface GameState {
  moves: readonly Move[];
}

export type GameAction =
  | { type: typeof GAME_ACTION.PLAY; move: Move; side: Side }
  | { type: typeof GAME_ACTION.UNDO }
  | { type: typeof GAME_ACTION.RESET };
