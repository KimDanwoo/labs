import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';
import { GuessRow } from '@views/guess-word/ui/GuessRow';

export function GuessWordLatest() {
  const { latest, record } = useGuessWordContext();
  if (!latest) return null;
  return (
    <section aria-label={GUESS_WORD_COPY.latestTitle}>
      <ol>
        <GuessRow entry={latest} answer={record.answer} isHighlighted />
      </ol>
    </section>
  );
}
