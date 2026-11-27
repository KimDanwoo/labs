import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';
import { useYesterdayAnswer } from '@views/guess-word/model/hooks/useYesterdayAnswer';

export function GuessWordHintLine() {
  const { day } = useGuessWordContext();
  const yesterday = useYesterdayAnswer(day);
  const text = yesterday === null ? GUESS_WORD_COPY.hintGuide : GUESS_WORD_COPY.yesterday(yesterday);

  return <p className="mt-2 text-center text-[13px] text-text-tertiary break-keep lg:text-left">{text}</p>;
}
