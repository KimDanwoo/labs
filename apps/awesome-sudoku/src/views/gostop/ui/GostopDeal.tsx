import { LuLayers } from 'react-icons/lu';

import { Button } from '@shared/ui/button';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { PHASE } from '@views/gostop/config/game';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function GostopDeal() {
  const { phase, deal } = useGostopContext();
  if (phase !== PHASE.READY) return null;

  return (
    <div className="absolute inset-0 grid place-content-center justify-items-center gap-3 rounded-[20px] bg-face/80 backdrop-blur-[2px]">
      <Button size="l" onClick={deal}>
        <LuLayers aria-hidden="true" />
        {GOSTOP_COPY.deal}
      </Button>
      <p className="text-[13px] text-text-tertiary">{GOSTOP_COPY.dealHint}</p>
    </div>
  );
}
