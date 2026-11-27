import { cn } from '@shared/lib/cn';
import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { GUESS_ROW_GRID, LATEST_IN_LIST_CLASS, RANK_TEXT_WIDTH } from '@views/guess-word/config/style';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';
import { GuessRow } from '@views/guess-word/ui/GuessRow';
import { GuessWordEmpty } from '@views/guess-word/ui/GuessWordEmpty';

export function GuessWordList() {
  const { sortedGuesses, latest, record } = useGuessWordContext();
  if (sortedGuesses.length === 0) return <GuessWordEmpty />;

  return (
    <section aria-label={GUESS_WORD_COPY.listTitle} className="flex min-h-0 flex-1 flex-col">
      <div className={cn(GUESS_ROW_GRID, 'shrink-0 px-3 pt-1 pb-1.5 text-xs text-text-tertiary')}>
        <span>{GUESS_WORD_COPY.columnOrder}</span>
        <span>{GUESS_WORD_COPY.columnWord}</span>
        <span className="text-right">{GUESS_WORD_COPY.columnSimilarity}</span>
        <span className={cn('justify-self-end text-right', RANK_TEXT_WIDTH)}>{GUESS_WORD_COPY.columnRank}</span>
      </div>
      <ol className="grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto overscroll-contain">
        {sortedGuesses.map((entry) => (
          <GuessRow
            key={entry.word}
            entry={entry}
            answer={record.answer}
            className={cn(entry.word === latest?.word && LATEST_IN_LIST_CLASS)}
          />
        ))}
      </ol>
    </section>
  );
}
