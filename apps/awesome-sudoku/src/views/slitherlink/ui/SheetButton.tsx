import { cn } from '@shared/lib/cn';
import { SHEET_BUTTON_VARIANT, type SheetButtonVariant } from '@views/slitherlink/config/sheetButton';
import type { ComponentProps } from 'react';

interface SheetButtonProps extends ComponentProps<'button'> {
  variant: SheetButtonVariant;
}

export function SheetButton({ variant, className, ...props }: SheetButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'h-12 rounded-xl text-base transition-all duration-200 ease-out active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        SHEET_BUTTON_VARIANT[variant],
        className,
      )}
    />
  );
}
