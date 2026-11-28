import { GOSTOP_COPY } from '@views/gostop/config/copy';
import type { ReactNode } from 'react';

interface GostopTableProps {
  children: ReactNode;
}

export function GostopTable({ children }: GostopTableProps) {
  return (
    <section aria-label={GOSTOP_COPY.tableLabel} className="grid w-full max-w-[600px] gap-2.5 lg:gap-3">
      {children}
    </section>
  );
}
