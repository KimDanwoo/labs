import type { ComponentProps } from 'react';

export function TransportIconButton({ type = 'button', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className="grid size-11 place-items-center rounded-full outline-none transition-[color,background-color,transform] duration-150 active:scale-90 text-dim hover:text-paper hover:bg-hairline-soft focus-visible:text-paper focus-visible:bg-hairline-soft aria-[pressed=true]:text-brass aria-[pressed=true]:bg-brass/15 aria-[pressed=true]:hover:text-brass aria-[pressed=true]:hover:bg-brass/25 aria-[pressed=true]:focus-visible:text-brass aria-[pressed=true]:focus-visible:bg-brass/25"
      {...props}
    />
  );
}
