export { colors } from './colors';
export type { ColorToken, ThemeMode } from './colors';

export { commonColors, rootScalars, themeColors } from './palette';
export type { ThemeColorScale } from './palette';

export { fontFamily, fontSize, fontWeight } from './typography';
export type { FontFamilyToken, FontSizeToken, FontWeightToken } from './typography';

export { container, radius, spacing } from './spacing';
export type { ContainerToken, RadiusToken, SpacingToken } from './spacing';

export { shadow } from './shadow';
export type { ShadowToken } from './shadow';

import { colors } from './colors';
import { commonColors, rootScalars, themeColors } from './palette';
import { shadow } from './shadow';
import { container, radius, spacing } from './spacing';
import { fontFamily, fontSize, fontWeight } from './typography';

/** 모든 토큰을 한 번에 참조할 때 쓰는 통합 객체. */
export const tokens = {
  themeColors,
  commonColors,
  rootScalars,
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  spacing,
  radius,
  shadow,
  container,
} as const;
