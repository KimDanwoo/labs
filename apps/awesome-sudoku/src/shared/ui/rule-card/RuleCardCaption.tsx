import type { ReactNode } from 'react';

interface RuleCardCaptionProps {
  children: ReactNode;
}

export function RuleCardCaption({ children }: RuleCardCaptionProps) {
  return <span className="col-start-2 text-[13px] text-text-secondary break-keep">{children}</span>;
}
