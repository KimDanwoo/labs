import type { ReactNode } from 'react';

import {
  ICON_CIRCLE_SIZE,
  ICON_CIRCLE_TONE,
  type IconCircleSize,
  type IconCircleTone,
} from '@shared/config/iconCircleStyle';
import { cn } from '@shared/lib/cn';

interface IconCircleProps {
  size?: IconCircleSize;
  tone?: IconCircleTone;
  className?: string;
  children: ReactNode;
}

export function IconCircle({ size = 'm', tone = 'soft', className, children }: IconCircleProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full',
        ICON_CIRCLE_SIZE[size],
        ICON_CIRCLE_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
