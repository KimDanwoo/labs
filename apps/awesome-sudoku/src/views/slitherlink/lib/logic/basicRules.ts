import { EDGE, LOOP_VERTEX_DEGREE } from '@views/slitherlink/config/board';
import { STEP } from '@views/slitherlink/config/solver';
import { itemAt } from '@views/slitherlink/lib/itemAt';
import { fillUnknownEdges, tallyEdges } from '@views/slitherlink/lib/logic/edgeTally';
import type { Clue, EdgeState, GridTopology, Step, StepBudget } from '@views/slitherlink/model/types/slitherlink';

const applyClue = (edges: EdgeState[], cellEdges: readonly number[], clue: number): Step => {
  const { lines, unknowns } = tallyEdges(edges, cellEdges);
  if (lines > clue || lines + unknowns < clue) return STEP.CONTRADICTION;
  if (lines === clue) return fillUnknownEdges(edges, cellEdges, EDGE.CROSS);
  if (lines + unknowns === clue) return fillUnknownEdges(edges, cellEdges, EDGE.LINE);
  return STEP.STABLE;
};

const applyVertex = (edges: EdgeState[], vertexEdges: readonly number[]): Step => {
  const { lines, unknowns } = tallyEdges(edges, vertexEdges);
  if (lines > LOOP_VERTEX_DEGREE) return STEP.CONTRADICTION;
  if (lines === LOOP_VERTEX_DEGREE) return fillUnknownEdges(edges, vertexEdges, EDGE.CROSS);
  if (lines === 1 && unknowns === 0) return STEP.CONTRADICTION;
  if (unknowns !== 1) return STEP.STABLE;
  return fillUnknownEdges(edges, vertexEdges, lines === 1 ? EDGE.LINE : EDGE.CROSS);
};

interface ConstraintGraph {
  cellCount: number;
  all: number[];
  edgesOf: number[][];
  constraintsOfEdge: number[][];
  affectedBy: number[][];
}

const graphs = new WeakMap<GridTopology, ConstraintGraph>();

const buildGraph = (topology: GridTopology): ConstraintGraph => {
  const edgesOf = [...topology.cellEdges, ...topology.vertexEdges];
  const constraintsOfEdge = topology.edgeCells.map((cells, edge) => [
    ...cells,
    ...itemAt(topology.edgeVertices, edge).map((vertex) => topology.cellCount + vertex),
  ]);
  const affectedBy = edgesOf.map((ids) => [...new Set(ids.flatMap((id) => itemAt(constraintsOfEdge, id)))]);
  return { cellCount: topology.cellCount, all: [...edgesOf.keys()], edgesOf, constraintsOfEdge, affectedBy };
};

const graphOf = (topology: GridTopology): ConstraintGraph => {
  const cached = graphs.get(topology);
  if (cached) return cached;
  const graph = buildGraph(topology);
  graphs.set(topology, graph);
  return graph;
};

const applyConstraint = (
  edges: EdgeState[],
  graph: ConstraintGraph,
  clues: readonly Clue[],
  constraint: number,
): Step => {
  const ids = itemAt(graph.edgesOf, constraint);
  if (constraint >= graph.cellCount) return applyVertex(edges, ids);
  const clue = itemAt(clues, constraint);
  return clue === null ? STEP.STABLE : applyClue(edges, ids, clue);
};

const enqueue = (queue: number[], queued: boolean[], constraints: readonly number[]): void => {
  for (const constraint of constraints) {
    if (itemAt(queued, constraint)) continue;
    queued[constraint] = true;
    queue.push(constraint);
  }
};

export const spendStep = (budget?: StepBudget): boolean => {
  if (!budget) return true;
  budget.remaining -= 1;
  return budget.remaining >= 0;
};

export const applyBasicRules = (
  edges: EdgeState[],
  topology: GridTopology,
  clues: readonly Clue[],
  seedEdges?: readonly number[],
  budget?: StepBudget,
): Step => {
  const graph = graphOf(topology);
  const queue: number[] = [];
  const queued = graph.all.map(() => false);
  if (seedEdges) seedEdges.forEach((edge) => enqueue(queue, queued, itemAt(graph.constraintsOfEdge, edge)));
  else enqueue(queue, queued, graph.all);

  let result: Step = STEP.STABLE;
  for (let head = 0; head < queue.length; head += 1) {
    const constraint = itemAt(queue, head);
    queued[constraint] = false;
    const step = applyConstraint(edges, graph, clues, constraint);
    if (step !== STEP.PROGRESS) {
      if (step === STEP.CONTRADICTION) return step;
      continue;
    }
    if (!spendStep(budget)) return STEP.EXHAUSTED;
    result = STEP.PROGRESS;
    enqueue(queue, queued, itemAt(graph.affectedBy, constraint));
  }
  return result;
};
