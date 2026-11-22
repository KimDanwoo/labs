import { SIDE } from '@views/walls/config/board';
import { OUTCOME_TITLE, STEP_TEXT, WALLS_COPY } from '@views/walls/config/copy';
import { OUTCOME } from '@views/walls/config/game';
import { useWallsContext } from '@views/walls/model/hooks/useWallsContext';

export function WallsStatus() {
  const { outcome, step, scores } = useWallsContext();

  return (
    <div className="flex w-full max-w-[480px] items-center justify-between gap-3">
      <p role="status" aria-live="polite" className="text-sm font-semibold text-text-primary break-keep">
        {outcome === OUTCOME.PLAYING ? STEP_TEXT[step] : OUTCOME_TITLE[outcome]}
      </p>
      <p
        aria-label={WALLS_COPY.scoreLabel}
        className="shrink-0 rounded-lg bg-bg-tertiary/80 px-3 py-1.5 text-sm font-semibold font-tabular backdrop-blur-sm"
      >
        <span className="text-accent-text">
          {WALLS_COPY.scoreMe} {scores[SIDE.ME]}
        </span>
        <span className="text-text-tertiary"> : </span>
        <span className="text-error-text">
          {scores[SIDE.COMPUTER]} {WALLS_COPY.scoreComputer}
        </span>
      </p>
    </div>
  );
}
