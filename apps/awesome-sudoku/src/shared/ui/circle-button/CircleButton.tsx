import type { ComponentProps } from 'react';

import { CIRCLE_BUTTON_SIZE, type CircleButtonSize } from '@shared/config/circleButtonStyle';
import { cn } from '@shared/lib/cn';

interface CircleButtonProps extends ComponentProps<'button'> {
  size?: CircleButtonSize;
}

export function CircleButton({ size = 'm', className, type = 'button', ...props }: CircleButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(
        'grid shrink-0 cursor-pointer place-items-center rounded-full bg-weak text-text-secondary transition-[transform,color] duration-150 hover:text-text-primary active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&_svg]:shrink-0',
        CIRCLE_BUTTON_SIZE[size],
        className,
      )}
    />
  );
}
