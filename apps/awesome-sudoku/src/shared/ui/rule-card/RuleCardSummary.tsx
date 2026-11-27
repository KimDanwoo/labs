import type { ReactNode } from 'react';
import { LuChevronDown } from 'react-icons/lu';

interface RuleCardSummaryProps {
  children: ReactNode;
}

export function RuleCardSummary({ children }: RuleCardSummaryProps) {
  return (
    <summary className="grid cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 rounded-3xl px-[18px] py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
      {children}
      <LuChevronDown
        aria-hidden="true"
        className="col-start-3 row-span-2 row-start-1 size-5 text-text-tertiary transition-transform duration-200 group-open:rotate-180"
      />
    </summary>
  );
}
