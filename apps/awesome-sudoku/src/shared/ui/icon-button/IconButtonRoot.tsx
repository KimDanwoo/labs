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
        'flex flex-col items-center justify-center gap-1.5 w-full aspect-square lg:max-w-[72px] xl:max-w-[88px] rounded-2xl text-xs font-normal tracking-wide transition-all duration-200 ease-out',
        disabled && 'opacity-40 cursor-not-allowed',
        variant === 'default' &&
          'bg-gradient-to-b from-bg-tertiary to-surface-tertiary text-text-secondary shadow-sm border border-border-light/50',
        variant === 'default' &&
          !disabled &&
          'hover:from-surface-primary hover:to-bg-tertiary hover:text-text-primary hover:shadow-md hover:border-border-light active:scale-95',
        variant === 'primary' &&
          'bg-gradient-to-b from-gradient-from to-gradient-to text-white shadow-lg shadow-gradient-from/30 border border-gradient-from/20',
        variant === 'primary' &&
          !disabled &&
          'hover:brightness-110 hover:shadow-xl hover:shadow-gradient-from/40 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 relative',
        className,
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
