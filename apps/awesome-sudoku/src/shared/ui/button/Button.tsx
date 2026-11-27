import type { ComponentProps } from 'react';

import type { ButtonLook } from '@shared/config/buttonStyle';
import { buttonClassName } from '@shared/ui/button/buttonClassName';

interface ButtonProps extends ComponentProps<'button'>, ButtonLook {}

export function Button({ variant, size, isFull, className, type = 'button', ...props }: ButtonProps) {
  return <button {...props} type={type} className={buttonClassName({ variant, size, isFull }, className)} />;
}
