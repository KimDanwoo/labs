import { BUTTON_BASE, BUTTON_SIZE, BUTTON_VARIANT, type ButtonLook } from '@shared/config/buttonStyle';
import { cn } from '@shared/lib/cn';

export function buttonClassName(
  { variant = 'fill', size = 'm', isFull = false }: ButtonLook,
  className?: string,
): string {
  return cn(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], isFull && 'w-full', className);
}
