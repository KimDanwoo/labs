import type { ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

interface IconButtonProps {
  icon: ReactNode;
  onClick: () => void;
  label?: string;
  'aria-label'?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'primary';
  badge?: string | number;
}

export const IconButton = ({
  icon,
  onClick,
  label,
  'aria-label': ariaLabel,
  className,
  disabled,
  variant = 'default',
  badge,
}: IconButtonProps) => (
  <button
    aria-label={ariaLabel ?? label}
    className={cn(
      'flex flex-col items-center justify-center gap-1.5 w-full aspect-square lg:max-w-[72px] xl:max-w-[88px] rounded-2xl text-xs font-normal tracking-wide transition-all duration-200 ease-out',
      disabled && 'opacity-40 cursor-not-allowed',
      variant === 'default' &&
        'bg-gradient-to-b from-[rgb(var(--color-bg-tertiary))] to-[rgb(var(--color-surface-tertiary))] text-[rgb(var(--color-text-secondary))] shadow-sm border border-[rgb(var(--color-border-light))]/50',
      variant === 'default' &&
        !disabled &&
        'hover:from-[rgb(var(--color-surface-primary))] hover:to-[rgb(var(--color-bg-tertiary))] hover:text-[rgb(var(--color-text-primary))] hover:shadow-md hover:border-[rgb(var(--color-border-light))] active:scale-95',
      variant === 'primary' &&
        'bg-gradient-to-b from-[rgb(var(--color-gradient-from))] to-[rgb(var(--color-gradient-to))] text-white shadow-lg shadow-[rgb(var(--color-gradient-from))]/30 border border-[rgb(var(--color-gradient-from))]/20',
      variant === 'primary' &&
        !disabled &&
        'hover:brightness-110 hover:shadow-xl hover:shadow-[rgb(var(--color-gradient-from))]/40 active:scale-95',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-accent))]/40 relative',
      className,
    )}
    onClick={onClick}
    disabled={disabled}
  >
    <span className="text-xl" aria-hidden="true">
      {icon}
    </span>
    {label && <span className="whitespace-nowrap">{label}</span>}
    {badge !== undefined && (
      <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 bg-gradient-to-br from-[rgb(var(--color-gradient-from))] to-[rgb(var(--color-gradient-to))] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-[rgb(var(--color-gradient-from))]/30 border-2 border-[rgb(var(--color-surface-primary))]">
        {badge}
      </span>
    )}
  </button>
);
