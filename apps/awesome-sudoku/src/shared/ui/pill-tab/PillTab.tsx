import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

interface PillTabProps extends ComponentProps<'button'> {
  isSelected: boolean;
}

export function PillTab({ isSelected, className, ...props }: PillTabProps) {
  return (
    <button
      {...props}
      type="button"
      role="tab"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      className={cn(
        'inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full bg-weak px-3.5 text-sm font-semibold text-text-tertiary transition-[color,background-color,scale] duration-200 ease-snappy hover:text-text-primary active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-selected:bg-primary aria-selected:font-bold aria-selected:text-on-primary',
        className,
      )}
    />
  );
}
