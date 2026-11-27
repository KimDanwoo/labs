'use client';

import { useState } from 'react';

import type { LottoRank } from '@views/lotto/config/lotto';
import { drawNumbers } from '@views/lotto/lib/draw';
import type { RandomInt } from '@views/lotto/lib/random';
import { rankOf } from '@views/lotto/lib/rank';
import type { LottoDraw } from '@views/lotto/model/types/lotto';

export interface SingleDraw {
  round: number;
  ticket: readonly number[];
  draw: LottoDraw;
  rank: LottoRank | null;
}

export function useSingleDraw(randomInt: RandomInt) {
  const [singleDraw, setSingleDraw] = useState<SingleDraw | null>(null);

  const drawOnce = (ticket: readonly number[]) => {
    const draw = drawNumbers(randomInt);
    setSingleDraw((previous) => ({ round: (previous?.round ?? 0) + 1, ticket, draw, rank: rankOf(ticket, draw) }));
  };

  return { singleDraw, drawOnce };
}
