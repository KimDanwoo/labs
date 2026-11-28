import type { ReactNode } from 'react';

interface ResultRowProps {
  label: string;
  children: ReactNode;
}

export function ResultRow({ label, children }: ResultRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-text-tertiary">{label}</dt>
      <dd className="flex flex-wrap justify-end gap-1 font-semibold text-text-primary tabular-nums">{children}</dd>
    </div>
  );
}
