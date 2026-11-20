import { EDGE } from '@views/slitherlink/config/board';
import { STROKE_MODE } from '@views/slitherlink/config/game';
import { applyBackward, condenseChanges } from '@views/slitherlink/lib/history';
import { itemAt } from '@views/slitherlink/lib/itemAt';
import { edgeBetween, latticeDistance, stepToward } from '@views/slitherlink/lib/lattice';
import { getTopology } from '@views/slitherlink/lib/topology';
import { commitEntry } from '@views/slitherlink/model/reducer/settle';
import type { EdgeChange, GameState, Stroke, StrokeMode } from '@views/slitherlink/model/types/game';
import type { EdgeState, GridTopology, SlitherlinkPuzzle } from '@views/slitherlink/model/types/slitherlink';

const strokeTarget = (mode: StrokeMode, current: EdgeState): EdgeState => {
  if (mode === STROKE_MODE.DRAW) return EDGE.LINE;
  return current === EDGE.LINE ? EDGE.UNKNOWN : current;
};

const withEdge = (edges: readonly EdgeState[], edge: number, value: EdgeState): EdgeState[] => {
  const next = [...edges];
  next[edge] = value;
  return next;
};

const retract = (state: GameState, stroke: Stroke): GameState => {
  const last = itemAt(stroke.steps, stroke.steps.length - 1);
  const steps = stroke.steps.slice(0, -1);
  return {
    ...state,
    edges: withEdge(state.edges, last.edge, last.from),
    stroke: { mode: steps.length > 0 ? stroke.mode : null, path: stroke.path.slice(0, -1), steps },
  };
};

const extend = (state: GameState, stroke: Stroke, edge: number, vertex: number): GameState => {
  const from = itemAt(state.edges, edge);
  const mode = stroke.mode ?? (from === EDGE.LINE ? STROKE_MODE.ERASE : STROKE_MODE.DRAW);
  const step: EdgeChange = { edge, from, to: strokeTarget(mode, from) };
  return {
    ...state,
    edges: withEdge(state.edges, edge, step.to),
    stroke: { mode, path: [...stroke.path, vertex], steps: [...stroke.steps, step] },
  };
};

const advance = (state: GameState, topology: GridTopology, vertex: number): GameState => {
  const { stroke } = state;
  if (!stroke) return state;
  const current = itemAt(stroke.path, stroke.path.length - 1);
  const edge = edgeBetween(topology, current, vertex);
  if (edge === null) return state;
  if (stroke.path[stroke.path.length - 2] === vertex) return retract(state, stroke);
  return extend(state, stroke, edge, vertex);
};

export const beginStroke = (state: GameState, vertex: number): GameState => ({
  ...state,
  stroke: { mode: null, path: [vertex], steps: [] },
});

export const strokeTo = (state: GameState, puzzle: SlitherlinkPuzzle, vertex: number): GameState => {
  if (!state.stroke) return state;
  const topology = getTopology(puzzle.size);
  let next = state;
  let current = itemAt(state.stroke.path, state.stroke.path.length - 1);
  const stepCount = latticeDistance(puzzle.size, current, vertex);
  for (let step = 0; step < stepCount; step += 1) {
    const toward = stepToward(puzzle.size, current, vertex);
    next = advance(next, topology, toward);
    current = toward;
  }
  return next;
};

export const endStroke = (state: GameState, puzzle: SlitherlinkPuzzle): GameState => {
  if (!state.stroke) return state;
  return commitEntry(state, puzzle, state.edges, condenseChanges(state.stroke.steps));
};

export const cancelStroke = (state: GameState): GameState => {
  if (!state.stroke) return state;
  return { ...state, edges: applyBackward(state.edges, state.stroke.steps), stroke: null };
};
