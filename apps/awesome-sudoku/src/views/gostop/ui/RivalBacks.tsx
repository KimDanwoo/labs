import { RIVAL_BACKS_MAX } from '@views/gostop/config/cardStyle';
import { FLIGHT_ORIGIN } from '@views/gostop/config/playback';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { CardBack } from '@views/gostop/ui/CardBack';

export function RivalBacks() {
  const { rivalHandCount } = useGostopContext();
  const backs = Array.from({ length: Math.min(rivalHandCount, RIVAL_BACKS_MAX) }, (_, index) => index);

  return (
    <span
      data-anchor={FLIGHT_ORIGIN.COMPUTER}
      aria-hidden="true"
      className="flex h-[30px] w-[74px] shrink-0 items-center"
    >
      {backs.map((index) => (
        <span key={index} className="-ml-[15px] w-5 shrink-0 first:ml-0">
          <CardBack />
        </span>
      ))}
    </span>
  );
}
