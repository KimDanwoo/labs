import type { ReactNode } from 'react';

interface IconButtonBadgeProps {
  children: ReactNode;
}

export function IconButtonBadge({ children }: IconButtonBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 bg-gradient-to-br from-gradient-from to-gradient-to text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-gradient-from/30 border-2 border-surface-primary"
    >
      {children}
    </span>
  );
}
