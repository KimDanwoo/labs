import { MONEY_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { stopPayout } from '@views/gostop/lib/moneyView';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { BakStamp } from '@views/gostop/ui/BakStamp';

export function DecideBaks() {
  const { wallet, preview } = useGostopContext();
  const payout = stopPayout(wallet, preview.stop[SIDE.ME]);
  const hasBaks = payout.baks.length > 0;
  const hasDetail = hasBaks || payout.isCapped;
  if (!hasDetail) return null;

  return (
    <p className="col-span-full flex flex-wrap items-center gap-1.5 pl-7">
      {payout.baks.map((bak, order) => (
        <BakStamp key={bak} bak={bak} order={order} />
      ))}
      {payout.isCapped && <span className="text-[12px] font-semibold text-text-tertiary">{MONEY_COPY.stopCapped}</span>}
    </p>
  );
}
