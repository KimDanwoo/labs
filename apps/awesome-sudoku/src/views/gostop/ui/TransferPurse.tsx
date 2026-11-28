import { cn } from '@shared/lib/cn';
import { PURSE_NAME } from '@views/gostop/config/purse';
import { purseLandingStyle } from '@views/gostop/lib/coinMotion';
import { flowOf, formatMoney, sideDelta } from '@views/gostop/lib/moneyView';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import type { Side } from '@views/gostop/model/types/gostop';
import styles from '@views/gostop/styles/money.module.css';
import { CoinGlyph } from '@views/gostop/ui/CoinGlyph';

interface TransferPurseProps {
  side: Side;
}

export function TransferPurse({ side }: TransferPurseProps) {
  const { wallet, settlement } = useGostopContext();
  const money = wallet.money[side];
  const flow = settlement ? flowOf(settlement, side) : 'even';
  const isLanding = flow === 'gain';

  return (
    <p
      className={cn('grid min-w-0 gap-0.5 rounded-xl bg-surface-elevated px-2.5 py-1.5', isLanding && styles.landing)}
      style={isLanding ? purseLandingStyle : undefined}
    >
      <span className="flex items-baseline justify-between gap-1.5 text-[12px] leading-4">
        <span className="font-semibold text-text-tertiary">{PURSE_NAME[side]}</span>
        <span
          data-flow={flow}
          className="font-bold whitespace-nowrap text-text-tertiary tabular-nums data-[flow=gain]:text-text-primary data-[flow=loss]:text-hwatu-red"
        >
          {sideDelta(settlement, side)}
        </span>
      </span>
      <span className="flex items-center gap-1 text-[14px] leading-5 font-extrabold whitespace-nowrap text-text-primary tabular-nums">
        <CoinGlyph isEmpty={money === 0} className="size-3.5" />
        {formatMoney(money)}
      </span>
    </p>
  );
}
