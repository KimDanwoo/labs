import { cn } from '@shared/lib/cn';
import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { useCardFlight } from '@views/gostop/model/hooks/useCardFlight';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';
import { useRef, type ReactNode } from 'react';

interface GostopTableProps {
  children: ReactNode;
}

export function GostopTable({ children }: GostopTableProps) {
  const { step, flight } = useGostopContext();
  const tableRef = useRef<HTMLElement>(null);
  useCardFlight(tableRef, step, flight);

  return (
    <section
      ref={tableRef}
      aria-label={GOSTOP_COPY.tableLabel}
      className={cn('dark relative grid w-full max-w-[600px] gap-2.5 p-3 lg:gap-3 lg:p-[18px]', styles.table)}
    >
      {children}
    </section>
  );
}
