export type IconCircleSize = 'm' | 'l';

export type IconCircleTone = 'soft' | 'ink';

export const ICON_CIRCLE_SIZE: Record<IconCircleSize, string> = {
  m: 'size-12 [&_svg]:size-6',
  l: 'size-14 [&_svg]:size-7',
};

export const ICON_CIRCLE_TONE: Record<IconCircleTone, string> = {
  soft: 'bg-lemon-soft text-on-lemon-soft [--glyph-hole:rgb(var(--rgb-lemon-soft))]',
  ink: 'bg-ink text-lemon [--glyph-hole:rgb(var(--rgb-ink))]',
};
