import { cn } from '@shared/lib/cn';
import { DEAL_STAGGER_MS, HAND_CARD_BASE, HAND_CARD_STATE } from '@views/gostop/config/cardStyle';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { handCardState } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/hwatuMotion.module.css';
import { HwatuCard } from '@views/gostop/ui/HwatuCard';

interface HandCardProps {
  id: number;
  order: number;
}

export function HandCard({ id, order }: HandCardProps) {
  const { isMyTurn, matchable, play } = useGostopContext();
  const state = handCardState(isMyTurn, matchable.has(id));
  const isMatch = state === 'match';

  const handlePlay = () => play(id);

  return (
    <li className={styles.deal} style={{ animationDelay: `${order * DEAL_STAGGER_MS}ms` }}>
      <button
        type="button"
        disabled={!isMyTurn}
        onClick={handlePlay}
        className={cn(HAND_CARD_BASE, HAND_CARD_STATE[state])}
      >
        <HwatuCard id={id} />
        {isMatch && <span className="sr-only">{GOSTOP_COPY.matchHint}</span>}
      </button>
    </li>
  );
}
