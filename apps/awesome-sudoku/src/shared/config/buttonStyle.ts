export type ButtonVariant = 'fill' | 'weak' | 'surface' | 'ink';
export type ButtonSize = 's' | 'm' | 'l' | 'xl';

export interface ButtonLook {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isFull?: boolean;
}

export const BUTTON_BASE =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 font-semibold whitespace-nowrap transition-[scale,opacity,background-color] duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 [&_svg]:size-[18px] [&_svg]:shrink-0';

export const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  fill: 'bg-primary text-on-primary hover:opacity-90',
  weak: 'bg-weak text-on-weak hover:bg-border-light',
  surface: 'bg-surface-primary text-on-weak hover:bg-border-light',
  ink: 'bg-ink text-white hover:opacity-90',
};

export const BUTTON_SIZE: Record<ButtonSize, string> = {
  s: 'h-8 rounded-lg px-3 text-[13px]',
  m: 'h-[38px] rounded-[10px] px-3.5 text-[15px]',
  l: 'h-12 rounded-[14px] px-5 text-[17px]',
  xl: 'h-14 rounded-2xl px-[22px] text-[17px]',
};
