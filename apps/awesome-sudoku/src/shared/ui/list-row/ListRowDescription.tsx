import type { ReactNode } from 'react';

interface ListRowDescriptionProps {
  children: ReactNode;
}

export function ListRowDescription({ children }: ListRowDescriptionProps) {
  return <span className="mt-px text-sm leading-normal text-text-tertiary">{children}</span>;
}
