import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';

export function GuessWordHints() {
  const { hints } = useGuessWordContext();
  if (!hints) return null;
  return (
    <section aria-label={GUESS_WORD_COPY.hintsTitle} className="rounded-[20px] bg-face px-3 py-4">
      <dl className="grid grid-cols-3 gap-2 text-center">
        {hints.map(({ rank, similarity }) => (
          <div key={rank} className="space-y-0.5">
            <dt className="text-[13px] text-text-secondary">{GUESS_WORD_COPY.hintLabel(rank)}</dt>
            <dd className="text-lg font-bold text-text-primary font-tabular">{similarity.toFixed(2)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
