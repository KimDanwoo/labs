import type { ComponentProps } from 'react';

import { BADGE_TONE, type BadgeTone } from '@shared/config/badgeStyle';
import { cn } from '@shared/lib/cn';

interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'lemon', className, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-full px-[9px] text-xs font-bold tabular-nums',
        BADGE_TONE[tone],
        className,
      )}
    />
  );
}
