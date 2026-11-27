import { formatTime } from '@shared/lib/formatTime';
import { StatusPill } from '@shared/ui/status-pill';
import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { useElapsedContext } from '@views/slitherlink/model/hooks/useElapsedContext';

export function GameTimer() {
  const seconds = useElapsedContext();

  return (
    <StatusPill.Root tone="weak" role="timer" aria-label={SLITHERLINK_COPY.timerLabel} className="min-w-[88px]">
      {formatTime(seconds)}
    </StatusPill.Root>
  );
}
