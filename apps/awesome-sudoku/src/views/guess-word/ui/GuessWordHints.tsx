import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';

export function GuessWordHints() {
  const { hints } = useGuessWordContext();
  if (!hints) return null;
  return (
    <section aria-label={GUESS_WORD_COPY.hintsTitle} className="rounded-xl bg-bg-tertiary/80 p-3">
      <dl className="grid grid-cols-3 gap-2 text-center">
        {hints.map(({ rank, similarity }) => (
          <div key={rank} className="space-y-0.5">
            <dt className="text-xs text-text-tertiary">{GUESS_WORD_COPY.hintLabel(rank)}</dt>
            <dd className="text-base font-semibold text-text-primary font-tabular">{similarity.toFixed(2)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
