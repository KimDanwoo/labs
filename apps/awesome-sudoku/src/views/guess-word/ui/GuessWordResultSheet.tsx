import { BottomSheet } from '@shared/ui/bottom-sheet';
import { SuccessIcon } from '@shared/ui/SuccessIcon';
import { GUESS_WORD_COPY, RESULT_TITLE } from '@views/guess-word/config/copy';
import { GUESS_STATUS } from '@views/guess-word/config/game';
import { solvedTries } from '@views/guess-word/lib/guessRecord';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';
import { GuessButton } from '@views/guess-word/ui/GuessButton';
import { GuessResultShare } from '@views/guess-word/ui/GuessResultShare';

export function GuessWordResultSheet() {
  const { record, isResultOpen, handleResultClose } = useGuessWordContext();
  const isSolved = record.status === GUESS_STATUS.SOLVED;
  const tries = solvedTries(record);
  return (
    <BottomSheet isOpen={isResultOpen} onClose={handleResultClose} title={RESULT_TITLE[record.status]}>
      {isSolved && <SuccessIcon />}
      <p className="mt-4 text-center text-3xl font-bold text-text-primary">{record.answer}</p>
      {isSolved && (
        <p className="mt-2 text-center text-sm text-text-secondary">
          {GUESS_WORD_COPY.triesText(tries ?? record.guesses.length)}
        </p>
      )}
      <p className="mt-1 text-center text-sm text-text-tertiary break-keep">{GUESS_WORD_COPY.tomorrow}</p>
      {isSolved && <GuessResultShare tries={tries ?? record.guesses.length} />}
      <GuessButton onClick={handleResultClose} className="mt-6 w-full">
        {GUESS_WORD_COPY.close}
      </GuessButton>
    </BottomSheet>
  );
}
