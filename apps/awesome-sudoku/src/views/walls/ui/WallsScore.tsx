import { cn } from '@shared/lib/cn';
import { PAWN_CLASS } from '@views/walls/config/cellStyle';
import { WALLS_COPY } from '@views/walls/config/copy';
import { SCORE_SIDES } from '@views/walls/config/score';
import { useWallsContext } from '@views/walls/model/hooks/useWallsContext';

export function WallsScore() {
  const { scores } = useWallsContext();

  return (
    <div>
      <dl aria-label={WALLS_COPY.scoreLabel} className="grid grid-cols-2 gap-1 rounded-[14px] bg-face p-1">
        {SCORE_SIDES.map(({ side, label }) => (
          <div
            key={side}
            className="flex h-[42px] items-center justify-center gap-2 rounded-[11px] bg-surface-primary text-[15px] font-semibold text-text-secondary dark:bg-border-medium"
          >
            <dt className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn('size-3.5 rounded-full border-[1.5px] border-ink', PAWN_CLASS[side])}
              />
              {label}
            </dt>
            <dd className="font-bold text-text-primary tabular-nums">{scores[side]}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-center text-[13px] text-text-tertiary lg:text-left short-landscape:hidden">
        {WALLS_COPY.scoreHint}
      </p>
    </div>
  );
}
