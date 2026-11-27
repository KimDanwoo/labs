import type { ReactNode } from 'react';

interface RuleCardBodyProps {
  children: ReactNode;
}

export function RuleCardBody({ children }: RuleCardBodyProps) {
  return (
    <div className="min-h-0 overflow-hidden">
      <div className="grid -translate-y-1 gap-3 pr-[18px] pb-[18px] pl-[68px] text-[15px] leading-[1.65] text-text-secondary opacity-0 transition-[opacity,translate] duration-240 ease-snappy break-keep group-open:translate-y-0 group-open:opacity-100">
        {children}
      </div>
    </div>
  );
}
