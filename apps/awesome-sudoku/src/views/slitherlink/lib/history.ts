import type { EdgeChange, HistoryEntry } from '@views/slitherlink/model/types/game';
import type { EdgeState } from '@views/slitherlink/model/types/slitherlink';

export const condenseChanges = (steps: readonly EdgeChange[]): HistoryEntry => {
  const byEdge = new Map<number, EdgeChange>();
  steps.forEach((step) => {
    const first = byEdge.get(step.edge);
    byEdge.set(step.edge, { edge: step.edge, from: first ? first.from : step.from, to: step.to });
  });
  return [...byEdge.values()].filter((change) => change.from !== change.to);
};

export const applyForward = (edges: readonly EdgeState[], entry: HistoryEntry): EdgeState[] => {
  const next = [...edges];
  entry.forEach(({ edge, to }) => {
    next[edge] = to;
  });
  return next;
};

export const applyBackward = (edges: readonly EdgeState[], entry: HistoryEntry): EdgeState[] => {
  const next = [...edges];
  [...entry].reverse().forEach(({ edge, from }) => {
    next[edge] = from;
  });
  return next;
};
