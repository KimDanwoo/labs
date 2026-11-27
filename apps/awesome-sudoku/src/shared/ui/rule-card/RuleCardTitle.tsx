import type { ReactNode } from 'react';

interface RuleCardTitleProps {
  children: ReactNode;
}

export function RuleCardTitle({ children }: RuleCardTitleProps) {
  return <span className="col-start-2 text-base font-bold text-text-primary">{children}</span>;
}
