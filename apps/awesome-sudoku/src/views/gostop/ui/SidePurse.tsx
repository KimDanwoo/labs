import { cn } from '@shared/lib/cn';
import { SIDE } from '@views/gostop/config/game';
import { PURSE_LABEL } from '@views/gostop/config/purse';
import { bonusShownAmount, formatMoney } from '@views/gostop/lib/moneyView';
import { useCountUp } from '@views/gostop/model/hooks/useCountUp';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import type { Side } from '@views/gostop/model/types/gostop';
import styles from '@views/gostop/styles/money.module.css';
import { CoinGlyph } from '@views/gostop/ui/CoinGlyph';

interface SidePurseProps {
  side: Side;
}

export function SidePurse({ side }: SidePurseProps) {
  const { wallet, bonus, isReducedMotion } = useGostopContext();
  const sideBonus = side === SIDE.ME ? bonus : null;
  const counted = useCountUp(sideBonus?.amount ?? 0, isReducedMotion || !sideBonus);
  const money = wallet.money[side];
  const shown = bonusShownAmount(money, sideBonus, counted);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-[3px] text-[12px] leading-none font-bold whitespace-nowrap text-white/90 tabular-nums',
        sideBonus && styles.filling,
      )}
    >
      <CoinGlyph isEmpty={shown === 0} className="size-[11px]" />
      <span className="sr-only">{PURSE_LABEL[side]}</span>
      <span aria-hidden="true">{formatMoney(shown)}</span>
      <span className="sr-only">{formatMoney(money)}</span>
    </span>
  );
}
