import { cn } from '@shared/lib/cn';
import { memo } from 'react';

interface NumberButtonProps {
  value: number;
  onClick: () => void;
  isDisabled: boolean;
}

export const NumberButton: React.FC<NumberButtonProps> = memo(({ value, onClick, isDisabled }) => (
  <button
    className={cn(
      'w-full aspect-square',
      'max-w-8 xs:max-w-10 lg:max-w-[72px] xl:max-w-[88px]',
      'rounded-xl md:rounded-2xl',
      'text-lg xs:text-xl md:text-3xl lg:text-4xl font-semibold',
      'font-tabular',
      'flex items-center justify-center',
      'transition-all duration-200 ease-out',
      isDisabled
        ? 'text-text-tertiary cursor-not-allowed bg-bg-tertiary/50 border border-border-light'
        : 'text-text-primary bg-linear-to-b from-surface-primary to-bg-tertiary shadow-sm border border-border-light/60 hover:from-accent-light hover:to-surface-primary hover:text-accent hover:shadow-md hover:border-accent/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
    )}
    aria-label={`숫자 ${value}`}
    onClick={onClick}
    disabled={isDisabled}
  >
    {value}
  </button>
));

NumberButton.displayName = 'NumberButton';
