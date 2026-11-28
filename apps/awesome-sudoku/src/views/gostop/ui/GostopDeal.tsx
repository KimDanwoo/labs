import type { MouseEvent } from 'react';
import { LuLayers } from 'react-icons/lu';

import { cn } from '@shared/lib/cn';
import { Button } from '@shared/ui/button';
import { DEAL_COPY, GOSTOP_COPY, MONEY_COPY } from '@views/gostop/config/copy';
import { PHASE, SIDE } from '@views/gostop/config/game';
import { isKeyboardClick } from '@views/gostop/lib/focus';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';
import { RecordStats } from '@views/gostop/ui/RecordStats';
import { SidePurse } from '@views/gostop/ui/SidePurse';

export function GostopDeal() {
  const { phase, deal, requestHandFocus } = useGostopContext();
  if (phase !== PHASE.READY) return null;

  const handleDeal = (event: MouseEvent<HTMLButtonElement>) => {
    if (isKeyboardClick(event)) requestHandFocus();
    deal();
  };

  return (
    <div
      className={cn(
        'z-20 [grid-column:1] [grid-row:mine-start/hand-end] grid content-center justify-items-center gap-2 px-5 py-2 lg:py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:justify-items-start lg:gap-x-6 lg:gap-y-2 lg:px-7',
        styles.dealPanel,
      )}
    >
      <p className="text-[22px] font-extrabold tracking-[-0.03em] text-white">{DEAL_COPY.title}</p>
      <p className="flex h-7 items-center gap-2 rounded-full bg-white/10 px-3 text-[12px] font-semibold text-white/65">
        <span aria-hidden="true">{MONEY_COPY.myPurse}</span>
        <SidePurse side={SIDE.ME} />
      </p>
      <Button size="l" onClick={handleDeal} className="lg:col-start-2 lg:row-span-3 lg:row-start-1">
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
