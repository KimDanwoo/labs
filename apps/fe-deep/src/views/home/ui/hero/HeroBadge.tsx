import type { ReactNode } from 'react';

interface HeroBadgeProps {
  children: ReactNode;
}

export function HeroBadge({ children }: HeroBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      {children}
    </div>
  );
}
