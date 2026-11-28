import { LuHourglass } from 'react-icons/lu';

import { HAND_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function HandTurnCue() {
  const { activeSide } = useGostopContext();
  if (activeSide !== SIDE.COMPUTER) return null;

  return (
    <p className="absolute top-0 left-1/2 z-20 inline-flex h-6 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-ink px-2.5 text-[12px] font-bold whitespace-nowrap text-white/90 shadow-[0_4px_10px_rgb(0_0_0/0.4)] ring-1 ring-white/20 [&_svg]:size-3.5 [&_svg]:text-lemon">
      <LuHourglass aria-hidden="true" />
      {HAND_COPY.waiting}
    </p>
  );
}
