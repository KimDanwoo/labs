import { cn } from '@shared/lib/cn';
import { StatusPill } from '@shared/ui/status-pill';
import { SIDE } from '@views/walls/config/board';
import { PAWN_CLASS } from '@views/walls/config/cellStyle';
import { OUTCOME_TITLE, STEP_TEXT, WALLS_COPY } from '@views/walls/config/copy';
import { OUTCOME } from '@views/walls/config/game';
import { useWallsContext } from '@views/walls/model/hooks/useWallsContext';

export function WallsStatus() {
  const { outcome, step, scores } = useWallsContext();

  return (
    <>
      <StatusPill.Root role="status" aria-live="polite">
        {outcome === OUTCOME.PLAYING ? STEP_TEXT[step] : OUTCOME_TITLE[outcome]}
      </StatusPill.Root>
      <StatusPill.Root tone="weak" aria-label={WALLS_COPY.scoreLabel}>
        <span aria-hidden="true" className={cn('size-3 rounded-full border-[1.5px] border-ink', PAWN_CLASS[SIDE.ME])} />
        {WALLS_COPY.scoreMe} {scores[SIDE.ME]}
        <span className="text-text-tertiary">:</span>
        {scores[SIDE.COMPUTER]} {WALLS_COPY.scoreComputer}
        <span
          aria-hidden="true"
          className={cn('size-3 rounded-full border-[1.5px] border-ink', PAWN_CLASS[SIDE.COMPUTER])}
        />
      </StatusPill.Root>
    </>
  );
}
