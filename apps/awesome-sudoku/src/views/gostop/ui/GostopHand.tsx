import { HAND_LIST } from '@views/gostop/config/cardStyle';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { sortByMonth } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { useHandFocus } from '@views/gostop/model/hooks/useHandFocus';
import { HandCard } from '@views/gostop/ui/HandCard';
import { HandTurnCue } from '@views/gostop/ui/HandTurnCue';

export function GostopHand() {
  const { myHand } = useGostopContext();
  const listRef = useHandFocus();

  return (
    <section aria-label={GOSTOP_COPY.handLabel} className="relative [grid-area:hand]">
      <HandTurnCue />
      <ul ref={listRef} className={HAND_LIST}>
        {sortByMonth(myHand).map((id) => (
          <HandCard key={id} id={id} />
        ))}
      </ul>
    </section>
  );
}
