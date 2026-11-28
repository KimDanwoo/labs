import { RIVAL_BACKS_MAX } from '@views/gostop/config/cardStyle';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { FLIGHT_ORIGIN } from '@views/gostop/config/playback';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { CardBack } from '@views/gostop/ui/CardBack';

export function RivalBacks() {
  const { rivalHandCount } = useGostopContext();
  const backs = Array.from({ length: Math.min(rivalHandCount, RIVAL_BACKS_MAX) }, (_, index) => index);
  const hasCards = rivalHandCount > 0;

  return (
    <span data-anchor={FLIGHT_ORIGIN.COMPUTER} className="relative flex h-[30px] min-w-5 shrink-0 items-center pr-1">
      {backs.map((index) => (
        <span key={index} aria-hidden="true" className="-ml-[16px] w-5 shrink-0 first:ml-0">
          <CardBack />
        </span>
      ))}
      {hasCards && (
        <span className="absolute -right-1.5 -bottom-1 rounded-full bg-ink px-1.5 text-[12px] leading-[18px] font-bold text-white tabular-nums ring-1 ring-white/25">
          {rivalHandCount}
          <span className="sr-only">{GOSTOP_COPY.rivalHand}</span>
        </span>
      )}
    </span>
  );
}
