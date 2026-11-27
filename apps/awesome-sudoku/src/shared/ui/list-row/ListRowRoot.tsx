import Link from 'next/link';
import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

type ListRowRootProps = ComponentProps<typeof Link>;

export function ListRowRoot({ className, ...props }: ListRowRootProps) {
  return (
    <Link
      {...props}
      className={cn(
        'group flex items-center gap-4 rounded-[14px] py-3.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
        className,
      )}
    />
  );
}
