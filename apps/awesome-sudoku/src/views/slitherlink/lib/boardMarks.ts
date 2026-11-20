import { EDGE } from '@views/slitherlink/config/board';
import { crossPath, type BoardLayout, type EdgeSegment } from '@views/slitherlink/lib/boardGeometry';
import type { EdgeState } from '@views/slitherlink/model/types/slitherlink';

export const segmentsIn = (layout: BoardLayout, edges: readonly EdgeState[], state: EdgeState): EdgeSegment[] =>
  layout.segments.filter((segment) => edges[segment.edge] === state);

export const crossesPath = (layout: BoardLayout, edges: readonly EdgeState[]): string =>
  segmentsIn(layout, edges, EDGE.CROSS).map(crossPath).join('');

export const segmentAt = (layout: BoardLayout, edge: number | null): EdgeSegment | null =>
  edge === null ? null : (layout.segments[edge] ?? null);
