import { GUESS_WORD_COPY, GUESS_WORD_CREDITS } from '@views/guess-word/config/copy';

export function GuessWordCredits() {
  return (
    <ul aria-label={GUESS_WORD_COPY.creditsTitle} className="space-y-1 text-xs text-text-secondary">
      {GUESS_WORD_CREDITS.map(({ label, href }) => (
        <li key={href}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-text-primary"
          >
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}
