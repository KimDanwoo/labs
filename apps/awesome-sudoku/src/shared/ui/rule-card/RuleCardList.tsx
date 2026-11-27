import type { ReactNode } from 'react';

interface RuleCardListProps {
  children: ReactNode;
}

export function RuleCardList({ children }: RuleCardListProps) {
  return <ol className="list-decimal space-y-2 pl-4 marker:font-semibold marker:text-text-tertiary">{children}</ol>;
}
