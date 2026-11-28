import { LuX } from 'react-icons/lu';

import { cn } from '@shared/lib/cn';
import { CircleButton } from '@shared/ui/circle-button';
import { BONUS_COPY, MONEY_COPY } from '@views/gostop/config/copy';
import { BONUS_COINS, BONUS_TOAST_MS } from '@views/gostop/config/purse';
import { formatMoney, type DailyBonus } from '@views/gostop/lib/moneyView';
import { useAutoDismiss } from '@views/gostop/model/hooks/useAutoDismiss';
import styles from '@views/gostop/styles/money.module.css';
import { CoinGlyph } from '@views/gostop/ui/CoinGlyph';

interface BonusToastProps {
  bonus: DailyBonus;
  onDismiss: () => void;
}

export function BonusToast({ bonus, onDismiss }: BonusToastProps) {
  useAutoDismiss(onDismiss, BONUS_TOAST_MS);

  return (
    <aside
      aria-label={BONUS_COPY.title}
      className={cn(
        'fixed inset-x-0 top-[max(12px,env(safe-area-inset-top))] z-40 mx-auto flex w-max max-w-[calc(100%-32px)] items-center gap-3 rounded-2xl bg-ink py-2 pr-2 pl-3.5 text-white ring-1 ring-lemon/50',
        styles.toast,
      )}
    >
      <span aria-hidden="true" className="relative grid size-9 shrink-0 place-items-center">
        {BONUS_COINS.map((coin) => (
          <span key={coin} className={styles.burst}>
            <CoinGlyph className="size-full" />
          </span>
        ))}
        <CoinGlyph className={cn('size-8', styles.bonusCoin)} />
      </span>
      <p className="grid leading-tight">
        <span className="text-[12px] font-bold text-white/70">{`${BONUS_COPY.title} · ${BONUS_COPY.note}`}</span>
        <span className="text-[20px] font-black tracking-[-0.02em] text-lemon tabular-nums">
          {`${MONEY_COPY.plus}${formatMoney(bonus.amount)}`}
        </span>
      </p>
      <CircleButton
        size="l"
        aria-label={BONUS_COPY.close}
        onClick={onDismiss}
        className="bg-white/10 text-white/75 hover:text-white"
      >
        <LuX aria-hidden="true" />
      </CircleButton>
    </aside>
  );
}
