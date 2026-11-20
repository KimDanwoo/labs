import type { GAME_ACTION, GAME_PHASE, STROKE_MODE } from '@views/slitherlink/config/game';
import type {
  EdgeState,
  Judgement,
  SlitherlinkLevel,
  SlitherlinkPuzzle,
} from '@views/slitherlink/model/types/slitherlink';

export type GamePhase = (typeof GAME_PHASE)[keyof typeof GAME_PHASE];
export type StrokeMode = (typeof STROKE_MODE)[keyof typeof STROKE_MODE];

export interface EdgeChange {
  edge: number;
  from: EdgeState;
  to: EdgeState;
}

export type HistoryEntry = readonly EdgeChange[];

export interface Stroke {
  mode: StrokeMode | null;
  path: readonly number[];
  steps: readonly EdgeChange[];
}

export interface GameState {
  phase: GamePhase;
  level: SlitherlinkLevel;
  requestId: number;
  puzzle: SlitherlinkPuzzle | null;
  edges: readonly EdgeState[];
  past: readonly HistoryEntry[];
  future: readonly HistoryEntry[];
  hintsRemaining: number;
  judgement: Judgement;
  lastHintEdge: number | null;
  stroke: Stroke | null;
}

export type LifecycleAction =
  | { type: typeof GAME_ACTION.GENERATE; level: SlitherlinkLevel }
  | { type: typeof GAME_ACTION.LOADED; requestId: number; puzzle: SlitherlinkPuzzle };

export type PlayAction =
  | { type: typeof GAME_ACTION.TAP_EDGE; edge: number }
  | { type: typeof GAME_ACTION.STROKE_BEGIN; vertex: number }
  | { type: typeof GAME_ACTION.STROKE_TO; vertex: number }
  | { type: typeof GAME_ACTION.STROKE_END }
  | { type: typeof GAME_ACTION.STROKE_CANCEL }
  | { type: typeof GAME_ACTION.UNDO }
  | { type: typeof GAME_ACTION.REDO }
  | { type: typeof GAME_ACTION.HINT; roll: number };

export type GameAction = LifecycleAction | PlayAction;
