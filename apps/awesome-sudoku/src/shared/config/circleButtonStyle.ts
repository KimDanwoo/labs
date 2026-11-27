export type CircleButtonSize = 's' | 'm';

export const CIRCLE_BUTTON_SIZE: Record<CircleButtonSize, string> = {
  s: 'size-9 [&_svg]:size-[18px]',
  m: 'size-10 [&_svg]:size-5',
};
