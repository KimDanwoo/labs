import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';
import { useYesterdayAnswer } from '@views/guess-word/model/hooks/useYesterdayAnswer';

export function GuessWordYesterday() {
  const { day } = useGuessWordContext();
  const yesterday = useYesterdayAnswer(day);
  if (!yesterday) return null;
  return (
    <p className="text-center text-sm text-text-tertiary">
      {GUESS_WORD_COPY.yesterdayLabel} <span className="font-semibold text-text-secondary">{yesterday}</span>
    </p>
  );
}
