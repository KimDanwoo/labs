import { cn } from '@shared/lib/cn';
import { BAK_LABEL, RESULT_COPY } from '@views/gostop/config/copy';
import { stampDelay } from '@views/gostop/lib/countUp';
import type { Bak } from '@views/gostop/model/types/gostop';
import styles from '@views/gostop/styles/result.module.css';

interface BakStampProps {
  bak: Bak;
  order: number;
}

export function BakStamp({ bak, order }: BakStampProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 -rotate-3 items-center rounded-md border-2 border-hwatu-red px-1.5 text-[12px] leading-none font-black whitespace-nowrap text-hwatu-red',
        styles.stamp,
      )}
      style={{ animationDelay: `${stampDelay(order)}ms` }}
    >
      {`${BAK_LABEL[bak]} ${RESULT_COPY.bakTimes}`}
    </span>
  );
}
