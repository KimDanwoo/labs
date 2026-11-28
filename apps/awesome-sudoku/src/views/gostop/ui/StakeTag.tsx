import { cn } from '@shared/lib/cn';
import { MONEY_COPY } from '@views/gostop/config/copy';
import { STAKE } from '@views/gostop/config/money';
import { formatMoney } from '@views/gostop/lib/moneyView';
import styles from '@views/gostop/styles/money.module.css';

export function StakeTag() {
  return (
    <span
      className={cn(
        'pointer-events-none absolute top-full left-1/2 mt-4 grid -translate-x-1/2 justify-items-center text-[12px] leading-[14px] font-bold whitespace-nowrap text-white/65 lg:mt-5 lg:flex lg:gap-1',
        styles.pot,
      )}
    >
      <span>{MONEY_COPY.stakePrefix}</span>
      <span className="text-lemon">{formatMoney(STAKE)}</span>
    </span>
  );
}
