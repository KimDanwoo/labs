import type { ReactNode } from 'react';

interface IconButtonLabelProps {
  children: ReactNode;
}

export function IconButtonLabel({ children }: IconButtonLabelProps) {
  return <span className="whitespace-nowrap">{children}</span>;
}
