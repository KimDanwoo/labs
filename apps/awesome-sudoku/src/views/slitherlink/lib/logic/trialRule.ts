import { EDGE } from '@views/slitherlink/config/board';
import { STEP } from '@views/slitherlink/config/solver';
import { outcomeOf } from '@views/slitherlink/lib/logic/edgeTally';
import type { EdgeState, RuleOutcome } from '@views/slitherlink/model/types/slitherlink';

export type ContradictionProbe = (edges: EdgeState[], edge: number) => boolean;
export type Settle = (edges: EdgeState[], edge: number) => boolean;

const DECIDED_STATES = [EDGE.LINE, EDGE.CROSS] as const;

const survivingStates = (edges: readonly EdgeState[], edge: number, probe: ContradictionProbe): EdgeState[] =>
  DECIDED_STATES.filter((state) => {
    const trial = [...edges];
    trial[edge] = state;
    return !probe(trial, edge);
  });

export const applyTrialRule = (edges: EdgeState[], probe: ContradictionProbe, settle: Settle): RuleOutcome => {
  const changed: number[] = [];
  for (const [edge, state] of edges.entries()) {
    if (state !== EDGE.UNKNOWN) continue;
    const [survivor, ...others] = survivingStates(edges, edge, probe);
    if (survivor === undefined) return { step: STEP.CONTRADICTION, changed };
    if (others.length > 0) continue;
    edges[edge] = survivor;
    changed.push(edge);
    if (!settle(edges, edge)) return { step: STEP.CONTRADICTION, changed };
  }
  return outcomeOf(changed);
};
