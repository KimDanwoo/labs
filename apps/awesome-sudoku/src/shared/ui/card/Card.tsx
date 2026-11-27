import type { ComponentProps } from 'react';

import { CARD_TONE, type CardTone } from '@shared/config/cardStyle';
import { cn } from '@shared/lib/cn';

interface CardProps extends ComponentProps<'div'> {
  tone?: CardTone;
}

export function Card({ tone = 'face', className, ...props }: CardProps) {
  return <div {...props} className={cn('rounded-3xl p-5', CARD_TONE[tone], className)} />;
}
