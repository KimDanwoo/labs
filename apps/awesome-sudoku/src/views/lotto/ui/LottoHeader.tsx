import { LOTTO_COPY } from '@views/lotto/config/copy';

export function LottoHeader() {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold text-text-primary">{LOTTO_COPY.title}</h1>
      <p className="text-sm text-text-secondary break-keep">{LOTTO_COPY.description}</p>
    </header>
  );
}
