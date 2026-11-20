import { EDGE } from '@views/slitherlink/config/board';
import { GAME_ACTION, GAME_PHASE, HINTS_BY_LEVEL, STROKE_FOLLOW_UP_ACTIONS } from '@views/slitherlink/config/game';
import { JUDGEMENT } from '@views/slitherlink/config/judgement';
import { nextEdgeState } from '@views/slitherlink/lib/edgeCycle';
import { pickHint } from '@views/slitherlink/lib/hint';
import { applyBackward, applyForward } from '@views/slitherlink/lib/history';
import { itemAt } from '@views/slitherlink/lib/itemAt';
import { commitEntry, settle } from '@views/slitherlink/model/reducer/settle';
import { beginStroke, cancelStroke, endStroke, strokeTo } from '@views/slitherlink/model/reducer/strokeReducer';
import type { GameAction, GameState, LifecycleAction, PlayAction } from '@views/slitherlink/model/types/game';
import type { SlitherlinkLevel, SlitherlinkPuzzle } from '@views/slitherlink/model/types/slitherlink';

type LoadedAction = Extract<LifecycleAction, { type: typeof GAME_ACTION.LOADED }>;

export const createInitialState = (level: SlitherlinkLevel): GameState => ({
  phase: GAME_PHASE.GENERATING,
  level,
  requestId: 1,
  puzzle: null,
  edges: [],
  past: [],
  future: [],
  hintsRemaining: HINTS_BY_LEVEL[level],
  judgement: JUDGEMENT.DRAWING,
  lastHintEdge: null,
  stroke: null,
});

const startGenerating = (state: GameState, level: SlitherlinkLevel): GameState => ({
  ...state,
  phase: GAME_PHASE.GENERATING,
  level,
  requestId: state.requestId + 1,
  stroke: null,
});

const loadPuzzle = (state: GameState, { requestId, puzzle }: LoadedAction): GameState => {
  if (state.phase !== GAME_PHASE.GENERATING || requestId !== state.requestId) return state;
  return {
    ...createInitialState(state.level),
    phase: GAME_PHASE.PLAYING,
    requestId,
    puzzle,
    edges: puzzle.solution.map(() => EDGE.UNKNOWN),
  };
};

const tapEdge = (state: GameState, puzzle: SlitherlinkPuzzle, edge: number): GameState => {
  const from = itemAt(state.edges, edge);
  const change = { edge, from, to: nextEdgeState(from) };
  return commitEntry(state, puzzle, applyForward(state.edges, [change]), [change]);
};

const undo = (state: GameState, puzzle: SlitherlinkPuzzle): GameState => {
  const entry = state.past[state.past.length - 1];
  if (!entry) return state;
  return settle(state, puzzle, {
    edges: applyBackward(state.edges, entry),
    past: state.past.slice(0, -1),
    future: [...state.future, entry],
  });
};

const redo = (state: GameState, puzzle: SlitherlinkPuzzle): GameState => {
  const entry = state.future[state.future.length - 1];
  if (!entry) return state;
  return settle(state, puzzle, {
    edges: applyForward(state.edges, entry),
    past: [...state.past, entry],
    future: state.future.slice(0, -1),
  });
};

const applyHint = (state: GameState, puzzle: SlitherlinkPuzzle, roll: number): GameState => {
  if (state.hintsRemaining <= 0) return state;
  const move = pickHint(state.edges, puzzle.solution, () => roll);
  if (!move) return state;
  const change = { edge: move.edge, from: itemAt(state.edges, move.edge), to: move.state };
  const settled = commitEntry(state, puzzle, applyForward(state.edges, [change]), [change]);
  return { ...settled, hintsRemaining: state.hintsRemaining - 1, lastHintEdge: move.edge };
};

const playReducer = (state: GameState, puzzle: SlitherlinkPuzzle, action: PlayAction): GameState => {
  switch (action.type) {
    case GAME_ACTION.TAP_EDGE:
      return tapEdge(state, puzzle, action.edge);
    case GAME_ACTION.STROKE_BEGIN:
      return beginStroke(state, action.vertex);
    case GAME_ACTION.STROKE_TO:
      return strokeTo(state, puzzle, action.vertex);
    case GAME_ACTION.STROKE_END:
      return endStroke(state, puzzle);
    case GAME_ACTION.STROKE_CANCEL:
      return cancelStroke(state);
    case GAME_ACTION.UNDO:
      return undo(state, puzzle);
    case GAME_ACTION.REDO:
      return redo(state, puzzle);
  }
  return applyHint(state, puzzle, action.roll);
};

const isBlockedByStroke = (state: GameState, action: PlayAction): boolean =>
  state.stroke !== null && !STROKE_FOLLOW_UP_ACTIONS.has(action.type);

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  if (action.type === GAME_ACTION.GENERATE) return startGenerating(state, action.level);
  if (action.type === GAME_ACTION.LOADED) return loadPuzzle(state, action);
  if (state.phase !== GAME_PHASE.PLAYING || !state.puzzle) return state;
  if (isBlockedByStroke(state, action)) return state;
  return playReducer(state, state.puzzle, action);
};
