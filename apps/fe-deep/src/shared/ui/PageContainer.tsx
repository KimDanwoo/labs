import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

import { styles } from './PageContainer.styles';

interface PageContainerProps extends ComponentProps<'div'> {
  width: keyof typeof styles.width;
  enter?: keyof typeof styles.enter;
}

export function PageContainer({ width, enter = 'none', className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn('container mx-auto px-4 py-8 sm:py-12', styles.width[width], styles.enter[enter], className)}
      {...props}
    />
  );
}
