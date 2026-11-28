import { LuLayers } from 'react-icons/lu';

import { cn } from '@shared/lib/cn';
import { Button } from '@shared/ui/button';
import { DEAL_COPY, GOSTOP_COPY } from '@views/gostop/config/copy';
import { PHASE } from '@views/gostop/config/game';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';
import { RecordStats } from '@views/gostop/ui/RecordStats';

export function GostopDeal() {
  const { phase, deal } = useGostopContext();
  if (phase !== PHASE.READY) return null;

  return (
    <div
      className={cn(
        'z-20 [grid-column:1] [grid-row:mine-start/hand-end] grid content-center justify-items-center gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:justify-items-start lg:gap-x-6 lg:gap-y-2 lg:px-7',
        styles.dealPanel,
      )}
    >
      <p className="text-[22px] font-extrabold tracking-[-0.03em] text-white">{DEAL_COPY.title}</p>
      <Button size="l" onClick={deal} className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <LuLayers aria-hidden="true" />
        {GOSTOP_COPY.deal}
      </Button>
      <p className="text-[13px] text-white/70">{GOSTOP_COPY.dealHint}</p>
      <div className="grid w-full justify-items-center lg:hidden">
        <RecordStats />
      </div>
    </div>
  );
}
