import { cn } from '@shared/lib/cn';
import { Badge } from '@shared/ui/badge';
import { CHIP_STAGGER_MS } from '@views/gostop/config/cardStyle';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { turnChips, turnKey, turnSummary } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/hwatuMotion.module.css';
import { HwatuCard } from '@views/gostop/ui/HwatuCard';

export function TurnLog() {
  const { lastTurn } = useGostopContext();

  if (!lastTurn) {
    return <p className="text-[13px] text-text-tertiary break-keep">{GOSTOP_COPY.turnHint}</p>;
  }

  const { played, flipped } = lastTurn;

  return (
    <div key={turnKey(lastTurn)} className="flex min-w-0 flex-wrap items-center gap-1.5">
      <HwatuCard id={played} className={cn('w-6 lg:w-7', styles.chip)} />
      {flipped !== null && <HwatuCard id={flipped} className={cn('w-6 lg:w-7', styles.flip)} />}
      <p className="text-[13px] font-semibold text-text-secondary">{turnSummary(lastTurn)}</p>
      <ul className="flex gap-1">
        {turnChips(lastTurn).map((chip, index) => (
          <li key={chip.key} className={styles.chip} style={{ animationDelay: `${(index + 1) * CHIP_STAGGER_MS}ms` }}>
            <Badge tone={chip.tone}>{chip.label}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
