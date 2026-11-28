import { cn } from '@shared/lib/cn';
import { Badge } from '@shared/ui/badge';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { FLIGHT_ORIGIN } from '@views/gostop/config/playback';
import { DECK_BACK_LAYERS, DECK_CELL } from '@views/gostop/config/table';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';
import { CardBack } from '@views/gostop/ui/CardBack';
import { ChoiceTag } from '@views/gostop/ui/ChoiceTag';
import { HeldCard } from '@views/gostop/ui/HeldCard';
import { RevealedCard } from '@views/gostop/ui/RevealedCard';

export function DeckPile() {
  const { deckCount, held, revealed } = useGostopContext();

  return (
    <li data-anchor={FLIGHT_ORIGIN.DECK} className={cn(styles.deck, DECK_CELL)}>
      {DECK_BACK_LAYERS.map((layer) => (
        <CardBack key={layer} className={cn('absolute inset-0', layer)} />
      ))}
      {revealed !== null && <RevealedCard id={revealed} />}
      {held !== null && <HeldCard id={held} />}
      <ChoiceTag />
      <Badge tone="lemon" className="absolute -bottom-3 left-1/2 z-20 h-5 -translate-x-1/2 px-2 text-[12px]">
        <span className="sr-only">{GOSTOP_COPY.deckLabel} </span>
        {deckCount}
        <span className="sr-only">{GOSTOP_COPY.cardUnit}</span>
      </Badge>
    </li>
  );
}
