import { EDGE } from '@views/slitherlink/config/board';
import { itemAt } from '@views/slitherlink/lib/itemAt';
import { outcomeOf, tallyEdges } from '@views/slitherlink/lib/logic/edgeTally';
import type { LineComponents } from '@views/slitherlink/lib/logic/lineComponents';
import type { Clue, EdgeState, GridTopology, RuleOutcome } from '@views/slitherlink/model/types/slitherlink';

export const crossRemaining = (edges: EdgeState[]): number[] => {
  const changed: number[] = [];
  for (let edge = 0; edge < edges.length; edge += 1) {
    if (itemAt(edges, edge) !== EDGE.UNKNOWN) continue;
    edges[edge] = EDGE.CROSS;
    changed.push(edge);
  }
  return changed;
};

const cluesMetByClosing = (
  edges: readonly EdgeState[],
  topology: GridTopology,
  clues: readonly Clue[],
  closingEdge: number,
): boolean =>
  clues.every((clue, cell) => {
    if (clue === null) return true;
    const cellEdges = itemAt(topology.cellEdges, cell);
    const closing = cellEdges.includes(closingEdge) ? 1 : 0;
    return tallyEdges(edges, cellEdges).lines + closing === clue;
  });

const closesLoop = (topology: GridTopology, components: LineComponents, edge: number): boolean => {
  const [from, to] = itemAt(topology.edgeVertices, edge);
  return components.find(from) === components.find(to);
};

export const applyLoopRule = (
  edges: EdgeState[],
  topology: GridTopology,
  clues: readonly Clue[],
  components: LineComponents,
): RuleOutcome => {
  const changed: number[] = [];
  for (let edge = 0; edge < edges.length; edge += 1) {
    const isLoopClosingCandidate = itemAt(edges, edge) === EDGE.UNKNOWN && closesLoop(topology, components, edge);
    if (!isLoopClosingCandidate) continue;
    const isFinalClosure = components.componentCount === 1 && cluesMetByClosing(edges, topology, clues, edge);
    if (isFinalClosure) continue;
    edges[edge] = EDGE.CROSS;
    changed.push(edge);
  }
  return outcomeOf(changed);
};
