import { cn } from '@shared/lib/cn';
import { BAK_LABEL, GOSTOP_COPY } from '@views/gostop/config/copy';
import { stampDelay } from '@views/gostop/lib/countUp';
import type { Bak } from '@views/gostop/model/types/gostop';
import motion from '@views/gostop/styles/hwatuMotion.module.css';

interface BakStampsProps {
  baks: readonly Bak[];
}

export function BakStamps({ baks }: BakStampsProps) {
  if (baks.length === 0) return GOSTOP_COPY.resultNoBak;

  return baks.map((bak, index) => (
    <span
      key={bak}
      className={cn(
        'inline-flex h-7 -rotate-3 items-center rounded-md border-2 border-hwatu-red px-2 text-[13px] font-black text-hwatu-red',
        motion.stamp,
      )}
      style={{ animationDelay: `${stampDelay(index)}ms` }}
    >
      {`${BAK_LABEL[bak]} ${GOSTOP_COPY.bakTimes}`}
    </span>
  ));
}
