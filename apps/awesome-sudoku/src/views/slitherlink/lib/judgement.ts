import { EDGE, LOOP_VERTEX_DEGREE } from '@views/slitherlink/config/board';
import { JUDGEMENT } from '@views/slitherlink/config/judgement';
import { itemAt } from '@views/slitherlink/lib/itemAt';
import { tallyEdges } from '@views/slitherlink/lib/logic/edgeTally';
import type { EdgeState, GridTopology, Judgement } from '@views/slitherlink/model/types/slitherlink';

const isLine = (state: EdgeState): boolean => state === EDGE.LINE;

const matchesSolution = (edges: readonly EdgeState[], solution: readonly EdgeState[]): boolean =>
  edges.every((state, edge) => isLine(state) === isLine(itemAt(solution, edge)));

const isClosedDrawing = (edges: readonly EdgeState[], topology: GridTopology): boolean =>
  edges.some(isLine) &&
  topology.vertexEdges.every((vertexEdges) => {
    const { lines } = tallyEdges(edges, vertexEdges);
    return lines === 0 || lines === LOOP_VERTEX_DEGREE;
  });

export const judgeDrawing = (
  edges: readonly EdgeState[],
  solution: readonly EdgeState[],
  topology: GridTopology,
): Judgement => {
  if (matchesSolution(edges, solution)) return JUDGEMENT.SOLVED;
  return isClosedDrawing(edges, topology) ? JUDGEMENT.WRONG_LOOP : JUDGEMENT.DRAWING;
};
