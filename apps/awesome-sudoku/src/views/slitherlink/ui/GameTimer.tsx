import { formatTime } from '@shared/lib/formatTime';
import { StatusPill } from '@shared/ui/status-pill';
import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { useElapsedContext } from '@views/slitherlink/model/hooks/useElapsedContext';
import { LuTimer } from 'react-icons/lu';

export function GameTimer() {
  const seconds = useElapsedContext();

  return (
    <StatusPill.Root role="timer" aria-label={SLITHERLINK_COPY.timerLabel} className="min-w-[112px] gap-1.5">
      <LuTimer aria-hidden="true" className="size-[18px]" />
      {formatTime(seconds)}
    </StatusPill.Root>
  );
}
