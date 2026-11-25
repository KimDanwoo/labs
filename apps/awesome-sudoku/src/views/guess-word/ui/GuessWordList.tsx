import { cn } from '@shared/lib/cn';
import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { GUESS_ROW_GRID } from '@views/guess-word/config/style';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';
import { GuessRow } from '@views/guess-word/ui/GuessRow';

export function GuessWordList() {
  const { sortedGuesses, latest, record } = useGuessWordContext();
  if (sortedGuesses.length === 0)
    return <p className="py-6 text-center text-sm text-text-tertiary">{GUESS_WORD_COPY.empty}</p>;
  return (
    <section aria-label={GUESS_WORD_COPY.listTitle} className="rounded-xl border border-border-light">
      <div className={cn(GUESS_ROW_GRID, 'border-b border-border-light px-3 py-2 text-xs text-text-tertiary')}>
        <span>{GUESS_WORD_COPY.columnOrder}</span>
        <span>{GUESS_WORD_COPY.columnWord}</span>
        <span className="text-right">{GUESS_WORD_COPY.columnSimilarity}</span>
        <span className="w-14 justify-self-end text-right sm:w-16">{GUESS_WORD_COPY.columnRank}</span>
      </div>
      <ol className="divide-y divide-border-light/60">
        {sortedGuesses.map((entry) => (
          <GuessRow key={entry.word} entry={entry} answer={record.answer} isHighlighted={entry.word === latest?.word} />
        ))}
      </ol>
    </section>
  );
}
