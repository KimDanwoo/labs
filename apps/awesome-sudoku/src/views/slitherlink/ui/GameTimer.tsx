import { formatTime } from '@shared/lib/formatTime';
import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { useElapsedContext } from '@views/slitherlink/model/hooks/useElapsedContext';

export function GameTimer() {
  const seconds = useElapsedContext();

  return (
    <div
      role="timer"
      aria-label={SLITHERLINK_COPY.timerLabel}
      className="rounded-lg bg-bg-tertiary/80 px-3 py-1.5 text-base font-semibold tracking-wide text-text-primary font-tabular backdrop-blur-sm"
    >
      {formatTime(seconds)}
    </div>
  );
}
