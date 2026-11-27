import { useDismissible } from '@shared/lib/useDismissible';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { Button } from '@shared/ui/button';
import { LOTTO_COPY } from '@views/lotto/config/copy';
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
    <BottomSheet isOpen={isOpen} onClose={dismiss} title={resultTitleOf(simulation)}>
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
          <Button variant="weak" size="l" isFull onClick={dismiss}>
            {LOTTO_COPY.close}
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
