import { useDismissible } from '@shared/lib/useDismissible';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { LOTTO_COPY } from '@views/lotto/config/copy';
import { GLASS_SHEET_CLASS } from '@views/lotto/config/style';
import { focusOnMount } from '@views/lotto/lib/focus';
import { hasRunResult, resultTitleOf } from '@views/lotto/lib/status';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoJackpotNote } from '@views/lotto/ui/LottoJackpotNote';
import { LottoMoneySummary } from '@views/lotto/ui/LottoMoneySummary';
import { LottoRankTally } from '@views/lotto/ui/LottoRankTally';

export function LottoResultSheet() {
  const { simulation } = useLottoContext();
  const { isOpen, dismiss } = useDismissible(hasRunResult(simulation));
  const tally = simulation.result?.tally;

  return (
    <BottomSheet isOpen={isOpen} onClose={dismiss} title={resultTitleOf(simulation)} className={GLASS_SHEET_CLASS}>
      {tally && (
        <div
          aria-live="polite"
          ref={focusOnMount}
          tabIndex={-1}
          className="flex flex-col gap-5 pt-1 focus:outline-none"
        >
          <LottoMoneySummary tally={tally} />
          <LottoRankTally tally={tally} />
          <LottoJackpotNote />
          <p className="text-[11px] leading-relaxed text-text-tertiary break-keep">{LOTTO_COPY.assumedNote}</p>
          <button
            type="button"
            onClick={dismiss}
            className="h-12 w-full rounded-2xl bg-black/5 text-base font-semibold text-text-primary transition-colors duration-200 hover:bg-black/9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:bg-white/8 dark:hover:bg-white/12"
          >
            {LOTTO_COPY.close}
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
