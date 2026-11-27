import { StatusPill } from '@shared/ui/status-pill';
import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';

export function GuessWordStatus() {
  const { day, record } = useGuessWordContext();
  const text = day === null ? GUESS_WORD_COPY.statusLoading : GUESS_WORD_COPY.status(day, record.guesses.length);

  return (
    <StatusPill.Root role="status" aria-live="polite">
      {text}
    </StatusPill.Root>
  );
}
