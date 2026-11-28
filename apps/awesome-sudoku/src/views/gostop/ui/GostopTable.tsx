import { cn } from '@shared/lib/cn';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { useCardFlight } from '@views/gostop/model/hooks/useCardFlight';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { useTableShake } from '@views/gostop/model/hooks/useTableShake';
import styles from '@views/gostop/styles/table.module.css';
import { useRef, type ReactNode } from 'react';

interface GostopTableProps {
  children: ReactNode;
}

export function GostopTable({ children }: GostopTableProps) {
  const { step, flight, cutIn, isReducedMotion } = useGostopContext();
  const tableRef = useRef<HTMLElement>(null);
  useCardFlight(tableRef, step, flight);
  useTableShake(tableRef, cutIn, isReducedMotion);

  return (
    <section
      ref={tableRef}
      aria-label={GOSTOP_COPY.tableLabel}
      className={cn(
        'dark relative grid w-full max-w-[600px] gap-2.5 p-2.5 lg:max-w-[720px] lg:gap-2.5 lg:p-4',
        styles.table,
      )}
    >
      {children}
    </section>
  );
}
