import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

export function FloatingButton({ className, type = 'button', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cn(
        'grid size-11 place-items-center rounded-full outline-none backdrop-blur-md transition-[color,background-color,box-shadow,transform] duration-150 active:scale-90',
        className,
      )}
      {...props}
    />
  );
}
