import type { EDGE } from '@views/slitherlink/config/board';
import type { SLITHERLINK_LEVEL, TECHNIQUE } from '@views/slitherlink/config/difficulty';
import type { JUDGEMENT } from '@views/slitherlink/config/judgement';
import type { SOLVE_STATUS, STEP } from '@views/slitherlink/config/solver';

export type EdgeState = (typeof EDGE)[keyof typeof EDGE];
export type SlitherlinkLevel = (typeof SLITHERLINK_LEVEL)[keyof typeof SLITHERLINK_LEVEL];
export type Technique = (typeof TECHNIQUE)[keyof typeof TECHNIQUE];
export type SolveStatus = (typeof SOLVE_STATUS)[keyof typeof SOLVE_STATUS];
export type Step = (typeof STEP)[keyof typeof STEP];
export type Judgement = (typeof JUDGEMENT)[keyof typeof JUDGEMENT];

export type Clue = number | null;
export type EdgeEnds = readonly [number, number];
export type Random = () => number;

export interface StepBudget {
  remaining: number;
}

export interface RuleOutcome {
  step: Step;
  changed: readonly number[];
}

export interface DifficultySpec {
  size: number;
  minTechnique: Technique;
  maxTechnique: Technique;
}

export interface GridTopology {
  size: number;
  cellCount: number;
  vertexCount: number;
  cellEdges: number[][];
  edgeCells: number[][];
  edgeVertices: EdgeEnds[];
  vertexEdges: number[][];
}

export interface EdgeMove {
  edge: number;
  state: EdgeState;
}

export interface SlitherlinkPuzzle {
  size: number;
  clues: Clue[];
  solution: EdgeState[];
}
