import type { ReactNode } from 'react';

interface ResultRowProps {
  label: string;
  children: ReactNode;
}

export function ResultRow({ label, children }: ResultRowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 pt-0.5 text-text-tertiary">{label}</dt>
      <dd className="flex min-w-0 flex-wrap justify-end gap-1.5 font-semibold text-text-primary tabular-nums">
        {children}
      </dd>
    </div>
  );
}
