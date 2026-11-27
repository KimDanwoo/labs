import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';
import { LOTTO_BUTTON_SIZE, LOTTO_BUTTON_VARIANT } from '@views/lotto/config/style';

interface LottoButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof LOTTO_BUTTON_VARIANT;
  size?: keyof typeof LOTTO_BUTTON_SIZE;
}

export function LottoButton({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: LottoButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(
        'rounded-xl transition-all duration-200 ease-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        LOTTO_BUTTON_SIZE[size],
        LOTTO_BUTTON_VARIANT[variant],
        className,
      )}
    />
  );
}
