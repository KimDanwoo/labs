import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

import { styles } from './Input.styles';

export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return <input type={type} data-slot="input" className={cn(styles.input, className)} {...props} />;
}
