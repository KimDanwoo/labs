import type { ComponentProps } from 'react';

import { STATUS_PILL_TONE, type StatusPillTone } from '@shared/config/statusPillStyle';
import { cn } from '@shared/lib/cn';

interface StatusPillRootProps extends ComponentProps<'p'> {
  tone?: StatusPillTone;
}

export function StatusPillRoot({ tone = 'lemon', className, ...props }: StatusPillRootProps) {
  return (
    <p
      {...props}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full px-[18px] py-2 text-center text-base leading-snug tabular-nums break-keep',
        STATUS_PILL_TONE[tone],
        className,
      )}
    />
  );
}
