export const fontFamily = {
  // --font-maruburi와 @font-face는 '@tokens/css/fonts.css'가 정의한다 — 앱은 반드시 함께 import한다.
  sans: 'var(--font-maruburi)',
  mono: 'var(--font-geist-mono), ui-monospace, monospace',
} as const;

export const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
} as const;

// 마루부리는 400·600·700만 제공한다. 500(medium)은 400과 똑같이 그려지므로 토큰에 두지 않는다.
// font-medium은 500을 가진 고정폭 서체(font-mono 등)에만 쓴다.
export const fontWeight = {
  normal: '400',
  semibold: '600',
  bold: '700',
} as const;

export type FontFamilyToken = keyof typeof fontFamily;
export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
