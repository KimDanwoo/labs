import { SIDE } from '@views/walls/config/board';
import { WALLS_COPY } from '@views/walls/config/copy';

export const SCORE_SIDES = [
  { side: SIDE.ME, label: WALLS_COPY.scoreMe },
  { side: SIDE.COMPUTER, label: WALLS_COPY.scoreComputer },
] as const;
