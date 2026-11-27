import type { ReactNode } from 'react';

interface ListRowBodyProps {
  children: ReactNode;
}

export function ListRowBody({ children }: ListRowBodyProps) {
  return <span className="flex min-w-0 flex-1 flex-col">{children}</span>;
}
