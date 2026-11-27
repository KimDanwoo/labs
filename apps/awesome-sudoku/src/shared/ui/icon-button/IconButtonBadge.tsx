import type { ReactNode } from 'react';

interface IconButtonBadgeProps {
  children: ReactNode;
}

export function IconButtonBadge({ children }: IconButtonBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-surface-primary bg-lemon px-1.5 text-xs font-bold text-ink tabular-nums"
    >
      {children}
    </span>
  );
}
