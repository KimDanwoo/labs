import { MONEY_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { formatMoney, stopPayout } from '@views/gostop/lib/moneyView';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { CoinGlyph } from '@views/gostop/ui/CoinGlyph';
import { DecideBaks } from '@views/gostop/ui/DecideBaks';

export function DecidePayout() {
  const { wallet, preview } = useGostopContext();
  const payout = stopPayout(wallet, preview.stop[SIDE.ME]);

  return (
    <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 rounded-2xl bg-weak px-4 py-3">
      <CoinGlyph className="size-5" />
      <p className="text-[14px] font-semibold text-text-secondary break-keep">{MONEY_COPY.stopMoney}</p>
      <p className="text-[22px] leading-none font-black tracking-[-0.02em] text-text-primary tabular-nums">
        {formatMoney(payout.amount)}
      </p>
      <DecideBaks />
    </div>
  );
}
