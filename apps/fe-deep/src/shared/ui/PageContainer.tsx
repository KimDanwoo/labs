import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

interface PageContainerProps extends ComponentProps<'div'> {
  width: 'narrow' | 'medium' | 'document' | 'wide';
  enter?: 'none' | 'fade' | 'rise';
}

export function PageContainer({ width, enter = 'none', className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn(
        'container mx-auto px-4 py-8 sm:py-12',
        { narrow: 'max-w-168', medium: 'max-w-4xl', document: 'max-w-[48rem]', wide: 'max-w-7xl' }[width],
        { none: '', fade: 'animate-fade-in', rise: 'animate-fade-in-up' }[enter],
        className,
      )}
      {...props}
    />
  );
}
