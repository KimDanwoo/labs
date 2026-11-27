import { cn } from '@shared/lib/cn';
import { GUESS_ROW_GRID } from '@views/guess-word/config/style';
import { rankView } from '@views/guess-word/lib/rankView';
import type { GuessEntry } from '@views/guess-word/model/types/guessWord';
import { RankCell } from '@views/guess-word/ui/RankCell';

interface GuessRowProps {
  entry: GuessEntry;
  answer: string | null;
  isHighlighted?: boolean;
  className?: string;
}

export function GuessRow({ entry, answer, isHighlighted = false, className }: GuessRowProps) {
  return (
    <li
      className={cn(GUESS_ROW_GRID, 'items-center rounded-xl px-3 py-2.5', isHighlighted && 'bg-lemon-soft', className)}
    >
      <span className="text-xs text-text-tertiary font-tabular">{entry.order}</span>
      <span className="truncate text-base font-semibold text-text-primary">{entry.word}</span>
      <span className="text-right text-sm text-text-secondary font-tabular">{entry.similarity.toFixed(2)}</span>
      <RankCell view={rankView(entry, answer)} />
    </li>
  );
}
