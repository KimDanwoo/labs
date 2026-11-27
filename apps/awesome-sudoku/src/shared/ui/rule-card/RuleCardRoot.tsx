import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

type RuleCardRootProps = ComponentProps<'details'>;

export function RuleCardRoot({ className, ...props }: RuleCardRootProps) {
  return <details {...props} className={cn('group rounded-3xl bg-face', className)} />;
}
