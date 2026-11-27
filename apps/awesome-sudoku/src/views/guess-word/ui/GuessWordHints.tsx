import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { hintCellsOf } from '@views/guess-word/lib/hintCells';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';
import { GuessWordHintLine } from '@views/guess-word/ui/GuessWordHintLine';

export function GuessWordHints() {
  const { hints } = useGuessWordContext();

  return (
    <div>
      <dl aria-label={GUESS_WORD_COPY.hintsTitle} className="grid grid-cols-3 gap-1 rounded-[14px] bg-face p-1">
        {hintCellsOf(hints).map(({ rank, value }) => (
          <div
            key={rank}
            className="flex h-[42px] min-w-0 items-center justify-center gap-1.5 rounded-[11px] bg-surface-primary text-[15px] dark:bg-border-medium"
          >
            <dt className="text-[13px] font-semibold text-text-tertiary">{GUESS_WORD_COPY.hintLabel(rank)}</dt>
            <dd className="font-bold text-text-primary tabular-nums">{value ?? GUESS_WORD_COPY.hintPending}</dd>
          </div>
        ))}
      </dl>
      <GuessWordHintLine />
    </div>
  );
}
