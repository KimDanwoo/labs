import { EDGE } from '@views/slitherlink/config/board';
import { STEP } from '@views/slitherlink/config/solver';
import { itemAt } from '@views/slitherlink/lib/itemAt';
import type { EdgeState, RuleOutcome, Step } from '@views/slitherlink/model/types/slitherlink';

export interface EdgeTally {
  lines: number;
  unknowns: number;
}

export const tallyEdges = (edges: readonly EdgeState[], ids: readonly number[]): EdgeTally => {
  let lines = 0;
  let unknowns = 0;
  for (const id of ids) {
    const state = itemAt(edges, id);
    if (state === EDGE.LINE) lines += 1;
    if (state === EDGE.UNKNOWN) unknowns += 1;
  }
  return { lines, unknowns };
};

export const fillUnknownEdges = (edges: EdgeState[], ids: readonly number[], state: EdgeState): Step => {
  let step: Step = STEP.STABLE;
  for (const id of ids) {
    if (itemAt(edges, id) !== EDGE.UNKNOWN) continue;
    edges[id] = state;
    step = STEP.PROGRESS;
  }
  return step;
};

export const outcomeOf = (changed: readonly number[]): RuleOutcome => ({
  step: changed.length > 0 ? STEP.PROGRESS : STEP.STABLE,
  changed,
});
