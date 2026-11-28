import type { MouseEvent } from 'react';

import { cn } from '@shared/lib/cn';
import { HAND_CARD_BASE, HAND_CARD_STATE, HAND_SLOT } from '@views/gostop/config/cardStyle';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { focusNeighborCard } from '@views/gostop/lib/focus';
import { handCardState } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { HwatuCard } from '@views/gostop/ui/HwatuCard';

interface HandCardProps {
  id: number;
}

export function HandCard({ id }: HandCardProps) {
  const { isMyTurn, matchable, play } = useGostopContext();
  const state = handCardState(isMyTurn, matchable.has(id));
  const isMatch = state === 'match';

  const handlePlay = (event: MouseEvent<HTMLButtonElement>) => {
    if (!isMyTurn) return;
    focusNeighborCard(event.currentTarget);
    play(id);
  };

  return (
    <li data-card={id} className={HAND_SLOT}>
      <button
        type="button"
        aria-disabled={!isMyTurn}
        onClick={handlePlay}
        className={cn(HAND_CARD_BASE, HAND_CARD_STATE[state])}
      >
        <HwatuCard id={id} className="shadow-[0_4px_10px_rgb(0_0_0/0.45)]" />
        {isMatch && <span className="sr-only">{GOSTOP_COPY.matchHint}</span>}
      </button>
    </li>
  );
}
