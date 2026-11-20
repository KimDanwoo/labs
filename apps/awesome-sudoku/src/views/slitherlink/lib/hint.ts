import { EDGE } from '@views/slitherlink/config/board';
import { itemAt } from '@views/slitherlink/lib/itemAt';
import { randomInt } from '@views/slitherlink/lib/random';
import type { EdgeMove, EdgeState, Random } from '@views/slitherlink/model/types/slitherlink';

type EdgeCheck = (state: EdgeState, answer: EdgeState) => boolean;

const contradictsAnswer: EdgeCheck = (state, answer) =>
  state !== EDGE.UNKNOWN && (state === EDGE.LINE) !== (answer === EDGE.LINE);

const missesLine: EdgeCheck = (state, answer) => answer === EDGE.LINE && state !== EDGE.LINE;

const edgesWhere = (edges: readonly EdgeState[], solution: readonly EdgeState[], check: EdgeCheck): number[] =>
  edges.flatMap((state, edge) => (check(state, itemAt(solution, edge)) ? [edge] : []));

export const pickHint = (
  edges: readonly EdgeState[],
  solution: readonly EdgeState[],
  random: Random = Math.random,
): EdgeMove | null => {
  const wrong = edgesWhere(edges, solution, contradictsAnswer);
  const candidates = wrong.length > 0 ? wrong : edgesWhere(edges, solution, missesLine);
  if (candidates.length === 0) return null;
  const edge = itemAt(candidates, randomInt(random, candidates.length));
  return { edge, state: itemAt(solution, edge) };
};
