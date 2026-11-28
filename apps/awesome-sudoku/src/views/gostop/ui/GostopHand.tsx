import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { sortByMonth } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { HandCard } from '@views/gostop/ui/HandCard';
import { HandTurnCue } from '@views/gostop/ui/HandTurnCue';

export function GostopHand() {
  const { myHand } = useGostopContext();

  return (
    <section aria-label={GOSTOP_COPY.handLabel} className="relative [grid-area:hand]">
      <HandTurnCue />
      <ul className="grid min-h-[186px] grid-cols-5 content-start gap-1.5 pt-2 lg:min-h-[84px] lg:grid-cols-10 lg:gap-2">
        {sortByMonth(myHand).map((id) => (
          <HandCard key={id} id={id} />
        ))}
      </ul>
    </section>
  );
}
