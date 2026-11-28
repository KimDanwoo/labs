import { HAND_PLACEHOLDERS } from '@views/gostop/config/cardStyle';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { PHASE } from '@views/gostop/config/game';
import { sortByMonth } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { HandCard } from '@views/gostop/ui/HandCard';

export function GostopHand() {
  const { myHand, phase } = useGostopContext();
  const isReady = phase === PHASE.READY;

  return (
    <section aria-label={GOSTOP_COPY.handLabel}>
      <ul className="grid grid-cols-5 gap-1.5 pt-2 lg:grid-cols-10 lg:gap-2">
        {sortByMonth(myHand).map((id, index) => (
          <HandCard key={id} id={id} order={index} />
        ))}
        {isReady &&
          HAND_PLACEHOLDERS.map((index) => (
            <li
              key={index}
              aria-hidden="true"
              className="aspect-[2/3] rounded-[5px] border border-dashed border-border-medium"
            />
          ))}
      </ul>
    </section>
  );
}
