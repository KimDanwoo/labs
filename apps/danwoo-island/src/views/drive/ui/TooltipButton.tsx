import type { ReactNode } from 'react';

interface TooltipButtonProps {
  className: string;
  tooltip: string;
  tooltipClassName?: string;
  children: ReactNode;
}

export function TooltipButton({ className, tooltip, tooltipClassName = 'tooltip', children }: TooltipButtonProps) {
  return (
    <button className={className}>
      <div className={tooltipClassName}>{tooltip}</div>
      {children}
    </button>
  );
}
