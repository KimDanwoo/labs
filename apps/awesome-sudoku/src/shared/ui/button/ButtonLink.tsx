import Link from 'next/link';
import type { ComponentProps } from 'react';

import type { ButtonLook } from '@shared/config/buttonStyle';
import { buttonClassName } from '@shared/ui/button/buttonClassName';

interface ButtonLinkProps extends ComponentProps<typeof Link>, ButtonLook {}

export function ButtonLink({ variant, size, isFull, className, ...props }: ButtonLinkProps) {
  return <Link {...props} className={buttonClassName({ variant, size, isFull }, className)} />;
}
