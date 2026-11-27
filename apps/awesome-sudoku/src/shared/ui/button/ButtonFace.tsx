import type { ComponentProps } from 'react';

import type { ButtonLook } from '@shared/config/buttonStyle';
import { buttonClassName } from '@shared/ui/button/buttonClassName';

interface ButtonFaceProps extends ComponentProps<'span'>, ButtonLook {}

export function ButtonFace({ variant, size, isFull, className, ...props }: ButtonFaceProps) {
  return <span {...props} className={buttonClassName({ variant, size, isFull }, className)} />;
}
