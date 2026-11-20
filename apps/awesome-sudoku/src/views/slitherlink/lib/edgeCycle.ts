import { EDGE } from '@views/slitherlink/config/board';
import type { EdgeState } from '@views/slitherlink/model/types/slitherlink';

const NEXT_EDGE_STATE: Record<EdgeState, EdgeState> = {
  [EDGE.UNKNOWN]: EDGE.LINE,
  [EDGE.LINE]: EDGE.CROSS,
  [EDGE.CROSS]: EDGE.UNKNOWN,
};

export const nextEdgeState = (state: EdgeState): EdgeState => NEXT_EDGE_STATE[state];
