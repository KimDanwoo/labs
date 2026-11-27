export type IconCircleSize = 's' | 'm' | 'l' | 'xl';

export type IconCircleTone = 'soft' | 'ink' | 'plain' | 'lemon' | 'weak';

export const ICON_CIRCLE_SIZE: Record<IconCircleSize, string> = {
  s: 'size-9 [&_svg]:size-[18px]',
  m: 'size-12 [&_svg]:size-6',
  l: 'size-14 [&_svg]:size-7',
  xl: 'size-16 [&_svg]:size-8',
};

export const ICON_CIRCLE_TONE: Record<IconCircleTone, string> = {
  soft: 'bg-lemon-soft text-on-lemon-soft [--glyph-hole:rgb(var(--rgb-lemon-soft))]',
  ink: 'bg-ink text-lemon [--glyph-hole:rgb(var(--rgb-ink))]',
  plain: 'bg-surface-primary text-text-secondary',
  lemon: 'bg-lemon text-ink',
  weak: 'bg-weak text-on-weak',
};
