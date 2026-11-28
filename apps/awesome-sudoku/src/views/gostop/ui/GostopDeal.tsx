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
        'absolute inset-0 z-20 grid place-content-center justify-items-center gap-4 px-6',
        styles.dealOverlay,
      )}
    >
      <p className="text-[22px] font-extrabold tracking-[-0.03em] text-white">{DEAL_COPY.title}</p>
      <Button size="l" onClick={deal}>
        <LuLayers aria-hidden="true" />
        {GOSTOP_COPY.deal}
      </Button>
      <p className="text-[13px] text-white/70">{GOSTOP_COPY.dealHint}</p>
      <RecordStats />
    </div>
  );
}
