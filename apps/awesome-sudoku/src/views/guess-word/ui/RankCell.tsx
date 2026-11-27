import { cn } from '@shared/lib/cn';
import { RANK_TEXT } from '@views/guess-word/config/copy';
import { RANK_TONE } from '@views/guess-word/config/game';
import { RANK_BAR_PERCENT, RANK_TONE_TEXT_CLASS } from '@views/guess-word/config/style';
import type { RankView } from '@views/guess-word/model/types/guessWord';

interface RankCellProps {
  view: RankView;
}

export function RankCell({ view }: RankCellProps) {
  const hasBar = view.tone !== RANK_TONE.FAR;
  return (
    <span className="flex items-center justify-end gap-2">
      {hasBar && (
        <span aria-hidden className="h-1.5 w-10 overflow-hidden rounded-full bg-surface-tertiary sm:w-20">
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${view.progress * RANK_BAR_PERCENT}%` }}
          />
        </span>
      )}
      <span className={cn('w-14 sm:w-16 text-right text-sm font-tabular', RANK_TONE_TEXT_CLASS[view.tone])}>
        {RANK_TEXT[view.tone](view.rank)}
      </span>
    </span>
  );
}
