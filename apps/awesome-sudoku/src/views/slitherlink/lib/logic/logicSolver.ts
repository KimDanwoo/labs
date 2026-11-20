import { EDGE } from '@views/slitherlink/config/board';
import { TECHNIQUE, TRIAL_STEP_LIMIT } from '@views/slitherlink/config/difficulty';
import { SOLVE_STATUS, STEP } from '@views/slitherlink/config/solver';
import { applyBasicRules, spendStep } from '@views/slitherlink/lib/logic/basicRules';
import { collectLineComponents, type LineComponents } from '@views/slitherlink/lib/logic/lineComponents';
import { applyLoopRule, crossRemaining } from '@views/slitherlink/lib/logic/loopRules';
import { applyTrialRule, type ContradictionProbe, type Settle } from '@views/slitherlink/lib/logic/trialRule';
import { getTopology } from '@views/slitherlink/lib/topology';
import type {
  Clue,
  EdgeState,
  GridTopology,
  RuleOutcome,
  SolveStatus,
  Step,
  StepBudget,
  Technique,
} from '@views/slitherlink/model/types/slitherlink';

export interface LogicResult {
  status: SolveStatus;
  edges: EdgeState[];
  hardest: Technique;
}

interface SolveContext {
  topology: GridTopology;
  clues: readonly Clue[];
  probe: ContradictionProbe;
  settle: Settle;
}

interface Propagation {
  status: SolveStatus;
  hardest: Technique;
}

interface AdvancedRule {
  technique: Technique;
  apply: (edges: EdgeState[], context: SolveContext, components: LineComponents) => RuleOutcome;
}

interface AppliedRule {
  outcome: RuleOutcome;
  technique: Technique;
}

const ADVANCED_RULES: readonly AdvancedRule[] = [
  {
    technique: TECHNIQUE.LOOP,
    apply: (edges, { topology, clues }, components) => applyLoopRule(edges, topology, clues, components),
  },
  { technique: TECHNIQUE.TRIAL, apply: (edges, { probe, settle }) => applyTrialRule(edges, probe, settle) },
];

const NO_PROGRESS: AppliedRule = { outcome: { step: STEP.STABLE, changed: [] }, technique: TECHNIQUE.BASIC };

const HALTING_BASIC_STEPS: Partial<Record<Step, SolveStatus>> = {
  [STEP.CONTRADICTION]: SOLVE_STATUS.CONTRADICTION,
  [STEP.EXHAUSTED]: SOLVE_STATUS.STUCK,
};

const harderOf = (current: Technique, next: Technique): Technique => (next > current ? next : current);

const closeLoop = (edges: EdgeState[], { topology, clues }: SolveContext, components: LineComponents): SolveStatus => {
  if (components.componentCount > 1) return SOLVE_STATUS.CONTRADICTION;
  const crossed = crossRemaining(edges);
  const step = applyBasicRules(edges, topology, clues, crossed);
  return step === STEP.CONTRADICTION ? SOLVE_STATUS.CONTRADICTION : SOLVE_STATUS.SOLVED;
};

const applyNextRule = (
  edges: EdgeState[],
  context: SolveContext,
  components: LineComponents,
  maxTechnique: Technique,
): AppliedRule => {
  for (const rule of ADVANCED_RULES) {
    if (rule.technique > maxTechnique) break;
    const outcome = rule.apply(edges, context, components);
    if (outcome.step !== STEP.STABLE) return { outcome, technique: rule.technique };
  }
  return NO_PROGRESS;
};

const propagate = (
  edges: EdgeState[],
  context: SolveContext,
  maxTechnique: Technique,
  seedEdges?: readonly number[],
  budget?: StepBudget,
): Propagation => {
  let hardest: Technique = TECHNIQUE.BASIC;
  let seed = seedEdges;
  for (;;) {
    const halted = HALTING_BASIC_STEPS[applyBasicRules(edges, context.topology, context.clues, seed, budget)];
    if (halted) return { status: halted, hardest };
    const components = collectLineComponents(edges, context.topology);
    if (components.hasCycle) return { status: closeLoop(edges, context, components), hardest };
    if (!edges.includes(EDGE.UNKNOWN)) return { status: SOLVE_STATUS.CONTRADICTION, hardest };

    const { outcome, technique } = applyNextRule(edges, context, components, maxTechnique);
    if (outcome.step === STEP.CONTRADICTION) return { status: SOLVE_STATUS.CONTRADICTION, hardest };
    const isStuck = outcome.step === STEP.STABLE || !spendStep(budget);
    if (isStuck) return { status: SOLVE_STATUS.STUCK, hardest };
    hardest = harderOf(hardest, technique);
    seed = outcome.changed;
  }
};

export const solveLogically = (size: number, clues: readonly Clue[], maxTechnique: Technique): LogicResult => {
  const topology = getTopology(size);
  const edges: EdgeState[] = Array.from({ length: topology.edgeVertices.length }, () => EDGE.UNKNOWN);
  const context: SolveContext = {
    topology,
    clues,
    probe: (trial, edge) =>
      propagate(trial, context, TECHNIQUE.LOOP, [edge], { remaining: TRIAL_STEP_LIMIT }).status ===
      SOLVE_STATUS.CONTRADICTION,
    settle: (settled, edge) => applyBasicRules(settled, topology, clues, [edge]) !== STEP.CONTRADICTION,
  };
  const { status, hardest } = propagate(edges, context, maxTechnique);
  return { status, edges, hardest };
};
