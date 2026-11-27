import { LOTTO_COPY } from '@views/lotto/config/copy';

export function LottoAbout() {
  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-1">
      <p className="text-center text-sm leading-relaxed text-text-secondary break-keep">{LOTTO_COPY.rule}</p>
      <p className="text-center text-xs text-text-tertiary break-keep">{LOTTO_COPY.disclaimer}</p>
    </div>
  );
}
