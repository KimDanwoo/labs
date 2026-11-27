import { memo } from 'react';

interface NumberButtonProps {
  value: number;
  onClick: () => void;
  isDisabled: boolean;
}

export const NumberButton = memo(({ value, onClick, isDisabled }: NumberButtonProps) => (
  <button
    type="button"
    className="flex h-14 w-full min-w-0 cursor-pointer items-center justify-center rounded-[14px] bg-weak text-2xl font-semibold text-text-primary tabular-nums transition-[transform,background-color,opacity] duration-150 ease-out hover:bg-border-light active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 lg:h-[72px] lg:rounded-2xl lg:text-3xl"
    aria-label={`숫자 ${value}`}
    onClick={onClick}
    disabled={isDisabled}
  >
    {value}
  </button>
));

NumberButton.displayName = 'NumberButton';
