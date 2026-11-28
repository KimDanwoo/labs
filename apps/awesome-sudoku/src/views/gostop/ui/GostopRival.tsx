import { cn } from '@shared/lib/cn';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';
import { CapturedOpener } from '@views/gostop/ui/CapturedOpener';
import { CapturedRow } from '@views/gostop/ui/CapturedRow';
import { RivalAvatar } from '@views/gostop/ui/RivalAvatar';
import { RivalBacks } from '@views/gostop/ui/RivalBacks';
import { RivalBubble } from '@views/gostop/ui/RivalBubble';
import { RivalProfile } from '@views/gostop/ui/RivalProfile';
import { SideScore } from '@views/gostop/ui/SideScore';

export function GostopRival() {
  const { activeSide } = useGostopContext();

  return (
    <section
      aria-label={GOSTOP_COPY.rivalLabel}
      data-active={activeSide === SIDE.COMPUTER}
      className={cn(
        'relative grid items-center gap-x-2 [grid-area:rival] gap-y-1.5 px-2.5 py-2 lg:gap-x-4 lg:px-3',
        styles.side,
        styles.rivalGrid,
      )}
    >
      <div className="relative flex items-center gap-2 [grid-area:head] lg:gap-2.5">
        <RivalAvatar className="-mt-1 -mb-2 size-[42px] lg:my-0 lg:size-[60px]" />
        <div className="flex items-center gap-2 lg:flex-col lg:items-start lg:gap-1.5">
          <RivalProfile />
          <RivalBacks />
        </div>
        <RivalBubble />
      </div>
      <div className="flex justify-end [grid-area:score] lg:self-start">
        <SideScore side={SIDE.COMPUTER} />
      </div>
      <div className="min-w-0 [grid-area:cap]">
        <CapturedRow side={SIDE.COMPUTER} />
      </div>
      <CapturedOpener />
    </section>
  );
}
