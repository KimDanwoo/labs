import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

type RuleCardRootProps = ComponentProps<'details'>;

export function RuleCardRoot({ className, ...props }: RuleCardRootProps) {
  return (
    <details
      {...props}
      className={cn(
        'group rounded-3xl bg-face details-content:grid details-content:grid-rows-[0fr] details-content:transition-[grid-template-rows,content-visibility] details-content:transition-discrete details-content:duration-240 details-content:ease-snappy open:details-content:grid-rows-[1fr]',
        className,
      )}
    />
  );
}
