import type { ReactNode } from 'react';

interface ListRowTitleProps {
  children: ReactNode;
}

export function ListRowTitle({ children }: ListRowTitleProps) {
  return (
    <span className="text-[17px] leading-normal font-bold tracking-[-0.02em] text-text-primary group-hover:underline group-hover:underline-offset-4">
      {children}
    </span>
  );
}
