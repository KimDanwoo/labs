import type { ReactNode } from 'react';

interface RuleCardBodyProps {
  children: ReactNode;
}

export function RuleCardBody({ children }: RuleCardBodyProps) {
  return (
    <div className="grid gap-3 pr-[18px] pb-[18px] pl-[68px] text-[15px] leading-[1.65] text-text-secondary break-keep">
      {children}
    </div>
  );
}
