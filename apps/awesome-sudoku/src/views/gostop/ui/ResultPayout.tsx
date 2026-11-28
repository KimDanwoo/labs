import { MONEY_COPY, MONEY_HEADLINE } from '@views/gostop/config/copy';
import { flowOf, signedMoney } from '@views/gostop/lib/moneyView';
import { outcomeOf } from '@views/gostop/lib/view';
import { useCountUp } from '@views/gostop/model/hooks/useCountUp';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function ResultPayout() {
  const { result, settlement, isReducedMotion } = useGostopContext();
  const shown = useCountUp(settlement?.amount ?? 0, isReducedMotion);
  if (!settlement) return null;
  const flow = flowOf(settlement);
  const isEven = flow === 'even';
  const label = MONEY_HEADLINE[outcomeOf(result)] || MONEY_COPY.settleTitle;

  return (
    <p className="grid min-w-0 justify-items-center gap-1">
      <span className="text-[12px] font-bold opacity-75">{label}</span>
      <span
        data-flow={flow}
        className="text-[26px] leading-none font-black tracking-[-0.03em] whitespace-nowrap tabular-nums data-[flow=even]:text-[16px] data-[flow=even]:leading-[26px]"
      >
        <span aria-hidden="true">{isEven ? MONEY_COPY.noChange : signedMoney(shown, flow)}</span>
        <span className="sr-only">{isEven ? MONEY_COPY.noChange : signedMoney(settlement.amount, flow)}</span>
      </span>
    </p>
  );
}
