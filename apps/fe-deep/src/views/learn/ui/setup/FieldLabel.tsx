import type { ReactNode } from 'react';

interface FieldLabelProps {
  children: ReactNode;
}

export function FieldLabel({ children }: FieldLabelProps) {
  return <label className="text-sm font-normal mb-3 block">{children}</label>;
}
