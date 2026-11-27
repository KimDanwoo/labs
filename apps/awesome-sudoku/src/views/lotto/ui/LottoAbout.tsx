import { LOTTO_COPY, LOTTO_RULES } from '@views/lotto/config/copy';

export function LottoAbout() {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold tracking-wider text-text-secondary">{LOTTO_COPY.aboutTitle}</h2>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text-secondary break-keep">
        {LOTTO_RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ol>
      <p className="text-xs text-text-tertiary break-keep">{LOTTO_COPY.disclaimer}</p>
    </section>
  );
}
