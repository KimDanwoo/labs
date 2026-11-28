import { cn } from '@shared/lib/cn';
import { BOARD_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';
import { CapturedOpener } from '@views/gostop/ui/CapturedOpener';
import { CapturedRow } from '@views/gostop/ui/CapturedRow';
import { RiskChips } from '@views/gostop/ui/RiskChips';
import { SidePurse } from '@views/gostop/ui/SidePurse';
import { SideScore } from '@views/gostop/ui/SideScore';

export function GostopMine() {
  const { activeSide } = useGostopContext();

  return (
    <section
      aria-label={BOARD_COPY.mineLabel}
      data-active={activeSide === SIDE.ME}
      className={cn(
        'relative grid gap-1.5 [grid-area:mine] px-2.5 py-2 lg:gap-x-4 lg:px-3',
        styles.side,
        styles.mineGrid,
      )}
    >
      <div className="flex min-h-7 items-center gap-0.5 [grid-area:aside] lg:gap-1 lg:flex-col-reverse lg:items-end lg:justify-center">
        <SidePurse side={SIDE.ME} />
        <RiskChips />
        <SideScore side={SIDE.ME} />
      </div>
      <div className="min-w-0 [grid-area:cap]">
        <CapturedRow side={SIDE.ME} />
      </div>
      <CapturedOpener />
    </section>
  );
}
