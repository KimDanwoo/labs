import { cn } from '@shared/lib/cn';
import { BOARD_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';
import { CapturedRow } from '@views/gostop/ui/CapturedRow';
import { RiskChips } from '@views/gostop/ui/RiskChips';
import { SideScore } from '@views/gostop/ui/SideScore';

export function GostopMine() {
  const { activeSide } = useGostopContext();

  return (
    <section
      aria-label={BOARD_COPY.mineLabel}
      data-active={activeSide === SIDE.ME}
      className={cn('grid gap-1.5 px-2.5 py-2 lg:px-3', styles.side)}
    >
      <div className="flex min-h-7 items-center gap-1.5">
        <RiskChips />
        <SideScore side={SIDE.ME} />
      </div>
      <CapturedRow side={SIDE.ME} />
    </section>
  );
}
