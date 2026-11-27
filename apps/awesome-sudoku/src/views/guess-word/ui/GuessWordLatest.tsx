import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';
import { GuessRow } from '@views/guess-word/ui/GuessRow';
import styles from '@views/guess-word/ui/GuessRow.module.css';

export function GuessWordLatest() {
  const { latest, record } = useGuessWordContext();
  if (!latest) return null;

  return (
    <section aria-label={GUESS_WORD_COPY.latestTitle} className="shrink-0 rounded-xl bg-surface-primary">
      <ol>
        <GuessRow key={latest.word} entry={latest} answer={record.answer} isHighlighted className={styles.enter} />
      </ol>
    </section>
  );
}
