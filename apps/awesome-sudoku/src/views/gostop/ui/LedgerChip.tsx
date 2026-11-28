import type { ReactNode } from 'react';

interface LedgerChipProps {
  children: ReactNode;
}

export function LedgerChip({ children }: LedgerChipProps) {
  return (
    <li className="inline-flex h-6 items-center gap-1 rounded-full bg-surface-elevated px-2 text-[13px] whitespace-nowrap ring-1 ring-border-light">
      {children}
    </li>
  );
}
