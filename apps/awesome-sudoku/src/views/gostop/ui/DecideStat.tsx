import { cn } from '@shared/lib/cn';
import type { ReactNode } from 'react';

interface DecideStatProps {
  label: string;
  isAccent?: boolean;
  children: ReactNode;
}

export function DecideStat({ label, isAccent = false, children }: DecideStatProps) {
  return (
    <div className={cn('rounded-2xl px-2 py-3', isAccent ? 'bg-lemon text-ink' : 'bg-weak text-text-primary')}>
      <dt className="text-[13px] font-semibold opacity-75">{label}</dt>
      <dd className="mt-1 text-2xl font-extrabold tabular-nums">{children}</dd>
    </div>
  );
}
