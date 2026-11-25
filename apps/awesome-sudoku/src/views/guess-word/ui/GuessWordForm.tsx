import { GUESS_WORD_COPY, NOTICE_TEXT } from '@views/guess-word/config/copy';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';
import { GuessButton } from '@views/guess-word/ui/GuessButton';

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
          className="h-12 min-w-0 flex-1 rounded-xl border border-border-medium bg-surface-primary px-4 text-base text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        />
        <GuessButton type="submit" disabled={isGuessing} className="shrink-0">
          {GUESS_WORD_COPY.submit}
        </GuessButton>
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-error-text break-keep">
        {notice && NOTICE_TEXT[notice.kind](notice.word)}
      </p>
    </form>
  );
}
