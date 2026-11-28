import { cn } from '@shared/lib/cn';
import { SIDE } from '@views/gostop/config/game';
import { COIN_FLYERS } from '@views/gostop/config/purse';
import { coinFlyerStyle } from '@views/gostop/lib/coinMotion';
import { flowOf } from '@views/gostop/lib/moneyView';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/money.module.css';
import { CoinGlyph } from '@views/gostop/ui/CoinGlyph';
import { TransferPurse } from '@views/gostop/ui/TransferPurse';

export function MoneyTransfer() {
  const { settlement } = useGostopContext();
  if (!settlement) return null;

  return (
    <div data-flow={flowOf(settlement)} className={cn('grid items-center gap-1.5', styles.transfer)}>
      <TransferPurse side={SIDE.ME} />
      <span aria-hidden="true" className={cn('text-text-tertiary', styles.track)}>
        {COIN_FLYERS.map((index) => (
          <span key={index} className={styles.flyer} style={coinFlyerStyle(index)}>
            <CoinGlyph className="size-full" />
          </span>
        ))}
      </span>
      <TransferPurse side={SIDE.COMPUTER} />
    </div>
  );
}
