import { StatusPill } from '@shared/ui/status-pill';
import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';

export function GuessWordStatus() {
  const { day, record } = useGuessWordContext();
  if (day === null) return null;
  return (
    <>
      <StatusPill.Root>{GUESS_WORD_COPY.puzzleNumber(day)}</StatusPill.Root>
      <StatusPill.Root tone="weak">{GUESS_WORD_COPY.guessCount(record.guesses.length)}</StatusPill.Root>
    </>
  );
}
