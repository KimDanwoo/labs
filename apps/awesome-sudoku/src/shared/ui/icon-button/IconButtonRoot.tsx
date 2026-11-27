import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

interface IconButtonRootProps extends ComponentProps<'button'> {
  variant?: 'default' | 'primary';
}

export function IconButtonRoot({ variant = 'default', className, disabled, children, ...props }: IconButtonRootProps) {
  return (
    <button
      {...props}
      className={cn(
        'relative flex h-16 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-[13px] font-semibold transition-[scale,opacity,background-color,color] duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        variant === 'default' && 'bg-weak text-on-weak',
        variant === 'primary' && 'bg-primary text-on-primary',
        disabled && 'cursor-not-allowed opacity-40',
        !disabled && 'cursor-pointer active:scale-95',
        variant === 'default' && !disabled && 'hover:bg-border-light hover:text-text-primary',
        variant === 'primary' && !disabled && 'hover:opacity-90',
        className,
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
