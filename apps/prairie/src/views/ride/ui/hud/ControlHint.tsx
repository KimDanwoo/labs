import type { ReactNode } from 'react';

interface ControlHintProps {
  children: ReactNode;
}

export function ControlHint({ children }: ControlHintProps) {
  return <span className="flex items-center gap-sm">{children}</span>;
}
