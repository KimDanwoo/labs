import { Button } from '@shared/ui/button';
import { GUESS_WORD_COPY, NOTICE_TEXT } from '@views/guess-word/config/copy';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';

export function GuessWordForm() {
  const { input, notice, isGuessing, handleInputChange, handleSubmit } = useGuessWordContext();
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
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
          className="h-14 min-w-0 flex-1 rounded-2xl bg-weak px-[18px] text-[17px] text-text-primary placeholder:text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <Button type="submit" size="xl" disabled={isGuessing}>
          {GUESS_WORD_COPY.submit}
        </Button>
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-error-text break-keep">
        {notice && NOTICE_TEXT[notice.kind](notice.word)}
      </p>
    </form>
  );
}
