export { fontFamily, fontSize, fontWeight } from './typography';
export type { FontFamilyToken, FontSizeToken, FontWeightToken } from './typography';

export { container, radius, spacing } from './spacing';
export type { ContainerToken, RadiusToken, SpacingToken } from './spacing';

export { shadow } from './shadow';
export type { ShadowToken } from './shadow';

import { shadow } from './shadow';
import { container, radius, spacing } from './spacing';
import { fontFamily, fontSize, fontWeight } from './typography';

export const tokens = {
  fontFamily,
  fontSize,
  fontWeight,
  spacing,
  radius,
  shadow,
  container,
} as const;
