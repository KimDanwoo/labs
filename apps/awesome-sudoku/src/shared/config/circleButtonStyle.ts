export type CircleButtonSize = 's' | 'm' | 'l';

export const CIRCLE_BUTTON_SIZE: Record<CircleButtonSize, string> = {
  s: 'size-9 [&_svg]:size-[18px]',
  m: 'size-10 [&_svg]:size-5',
  l: 'size-11 [&_svg]:size-5',
};
