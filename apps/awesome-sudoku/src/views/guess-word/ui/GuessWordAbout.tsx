import { GUESS_WORD_COPY, GUESS_WORD_CREDITS, GUESS_WORD_RULES } from '@views/guess-word/config/copy';

export function GuessWordAbout() {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold tracking-wider text-text-secondary">{GUESS_WORD_COPY.rulesTitle}</h2>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text-secondary break-keep">
        {GUESS_WORD_RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ol>
      <ul className="space-y-1 text-xs text-text-tertiary break-keep">
        {GUESS_WORD_CREDITS.map(({ label, href }) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-text-secondary"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
