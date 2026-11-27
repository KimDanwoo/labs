import { GUESS_WORD_COPY, NOTICE_TEXT } from '@views/guess-word/config/copy';
import { GUESS_FORM_ID } from '@views/guess-word/config/game';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';

export function GuessWordForm() {
  const { input, notice, handleInputChange, handleSubmit } = useGuessWordContext();

  return (
    <form id={GUESS_FORM_ID} onSubmit={handleSubmit} className="shrink-0">
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        aria-label={GUESS_WORD_COPY.inputLabel}
        placeholder={GUESS_WORD_COPY.inputPlaceholder}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="send"
        className="h-12 w-full min-w-0 rounded-[14px] bg-surface-primary px-4 text-[17px] text-text-primary placeholder:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
      <p role="status" aria-live="polite" className="mt-1.5 px-1 text-[13px] text-error-text break-keep empty:mt-0">
        {notice && NOTICE_TEXT[notice.kind](notice.word)}
      </p>
    </form>
  );
}
