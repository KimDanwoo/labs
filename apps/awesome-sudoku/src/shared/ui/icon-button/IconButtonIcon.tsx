import type { ReactNode } from 'react';

interface IconButtonIconProps {
  children: ReactNode;
}

export function IconButtonIcon({ children }: IconButtonIconProps) {
  return (
    <span className="text-xl" aria-hidden="true">
      {children}
    </span>
  );
}
