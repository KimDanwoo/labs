import { cn } from '@shared/lib/cn';
import { GUESS_BUTTON_VARIANT } from '@views/guess-word/config/style';
import type { ComponentProps } from 'react';

interface GuessButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof GUESS_BUTTON_VARIANT;
}

export function GuessButton({ variant = 'primary', className, type = 'button', ...props }: GuessButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(
        'h-12 rounded-xl px-5 text-base transition-all duration-200 ease-out active:scale-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        GUESS_BUTTON_VARIANT[variant],
        className,
      )}
    />
  );
}
