import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';

export function GuessWordHeader() {
  const { day } = useGuessWordContext();
  return (
    <header className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">{GUESS_WORD_COPY.title}</h1>
        {day !== null && (
          <p className="text-sm font-semibold text-text-secondary font-tabular">{GUESS_WORD_COPY.puzzleNumber(day)}</p>
        )}
      </div>
      <p className="text-sm text-text-secondary break-keep">{GUESS_WORD_COPY.description}</p>
    </header>
  );
}
