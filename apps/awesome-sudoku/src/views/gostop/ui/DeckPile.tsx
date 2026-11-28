import { Badge } from '@shared/ui/badge';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { CardBack } from '@views/gostop/ui/CardBack';

export function DeckPile() {
  const { deckCount } = useGostopContext();

  return (
    <div
      role="img"
      aria-label={`${GOSTOP_COPY.deckLabel} ${deckCount}${GOSTOP_COPY.cardUnit}`}
      className="relative mr-2 w-[28px] shrink-0 lg:w-[34px]"
    >
      <CardBack className="absolute top-0.5 left-0.5" />
      <CardBack />
      <Badge tone="ink" className="absolute -right-2.5 -bottom-1.5 h-5 px-1.5 text-[11px]">
        {deckCount}
      </Badge>
    </div>
  );
}
