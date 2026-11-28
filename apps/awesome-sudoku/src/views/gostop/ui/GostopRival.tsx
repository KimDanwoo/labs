import { cn } from '@shared/lib/cn';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';
import { CapturedRow } from '@views/gostop/ui/CapturedRow';
import { RivalBacks } from '@views/gostop/ui/RivalBacks';
import { RivalProfile } from '@views/gostop/ui/RivalProfile';
import { SideScore } from '@views/gostop/ui/SideScore';

export function GostopRival() {
  const { activeSide } = useGostopContext();

  return (
    <section
      aria-label={GOSTOP_COPY.rivalLabel}
      data-active={activeSide === SIDE.COMPUTER}
      className={cn('grid gap-1.5 px-2.5 py-2 lg:px-3', styles.side)}
    >
      <div className="flex items-center gap-2">
        <RivalProfile />
        <RivalBacks />
        <SideScore side={SIDE.COMPUTER} />
      </div>
      <CapturedRow side={SIDE.COMPUTER} />
    </section>
  );
}
