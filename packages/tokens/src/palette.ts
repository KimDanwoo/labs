/**
 * Atomic 색상 팔레트 (OKLCH). semantic 색상(colors.ts)의 기반이 되는 원자 스케일.
 *
 * 색공간은 OKLCH — 지각적 균일성이 높아 스케일이 매끈하고 대비가 안정적이다.
 * **브랜드 램프(brand)는 hue를 `var(--brand-hue)`로 둬서, 앱이 hue 하나만 회전하면
 * 같은 L·C로 자기 브랜드색을 얻는다(스킨).** 기본 hue는 코발트(rootScalars.brand-hue).
 * 중립(gray)·상태(green/red/amber/sky)는 hue 고정.
 */
export const themeColors = {
  // 중립 — 쿨톤 고정(hue 264). 표면·텍스트·보더의 기반.
  gray: {
    50: 'oklch(0.985 0.002 264)',
    100: 'oklch(0.96 0.004 264)',
    200: 'oklch(0.92 0.006 264)',
    300: 'oklch(0.87 0.008 264)',
    400: 'oklch(0.70 0.010 264)',
    500: 'oklch(0.55 0.012 264)',
    600: 'oklch(0.40 0.012 264)',
    700: 'oklch(0.30 0.015 264)',
    800: 'oklch(0.20 0.018 264)',
    900: 'oklch(0.145 0.018 264)',
  },
  // 브랜드 — hue는 var로 회전(기본 코발트). L·C만 스케일이 고정.
  brand: {
    50: 'oklch(0.97 0.02 var(--brand-hue))',
    100: 'oklch(0.93 0.045 var(--brand-hue))',
    200: 'oklch(0.87 0.08 var(--brand-hue))',
    300: 'oklch(0.78 0.12 var(--brand-hue))',
    400: 'oklch(0.66 0.16 var(--brand-hue))',
    500: 'oklch(0.56 0.19 var(--brand-hue))',
    600: 'oklch(0.48 0.20 var(--brand-hue))',
    700: 'oklch(0.41 0.18 var(--brand-hue))',
    800: 'oklch(0.34 0.15 var(--brand-hue))',
    900: 'oklch(0.27 0.11 var(--brand-hue))',
  },
  // 성공 — green(hue 152)
  green: {
    50: 'oklch(0.96 0.03 152)',
    100: 'oklch(0.93 0.06 152)',
    200: 'oklch(0.88 0.10 152)',
    300: 'oklch(0.80 0.14 152)',
    400: 'oklch(0.72 0.16 152)',
    500: 'oklch(0.64 0.16 152)',
    600: 'oklch(0.56 0.15 152)',
    700: 'oklch(0.48 0.13 152)',
    800: 'oklch(0.40 0.10 152)',
    900: 'oklch(0.32 0.07 152)',
  },
  // 에러 — red(hue 27)
  red: {
    50: 'oklch(0.96 0.02 25)',
    100: 'oklch(0.93 0.04 25)',
    200: 'oklch(0.88 0.08 25)',
    300: 'oklch(0.80 0.13 25)',
    400: 'oklch(0.70 0.19 25)',
    500: 'oklch(0.62 0.23 27)',
    600: 'oklch(0.55 0.22 27)',
    700: 'oklch(0.48 0.20 27)',
    800: 'oklch(0.41 0.16 27)',
    900: 'oklch(0.35 0.12 27)',
  },
  // 경고 — amber(hue 62–85, 밝은 쪽이 더 노랑)
  amber: {
    50: 'oklch(0.97 0.03 85)',
    100: 'oklch(0.94 0.06 85)',
    200: 'oklch(0.90 0.10 85)',
    300: 'oklch(0.86 0.14 82)',
    400: 'oklch(0.82 0.16 78)',
    500: 'oklch(0.77 0.16 70)',
    600: 'oklch(0.68 0.15 62)',
    700: 'oklch(0.58 0.13 55)',
    800: 'oklch(0.48 0.10 50)',
    900: 'oklch(0.40 0.08 48)',
  },
  // 정보 — sky(hue 228–235). 브랜드(코발트)와 충돌 없게 별도 블루.
  sky: {
    50: 'oklch(0.97 0.02 235)',
    100: 'oklch(0.93 0.04 235)',
    200: 'oklch(0.88 0.07 233)',
    300: 'oklch(0.80 0.10 233)',
    400: 'oklch(0.72 0.13 230)',
    500: 'oklch(0.64 0.14 228)',
    600: 'oklch(0.55 0.13 228)',
    700: 'oklch(0.47 0.11 228)',
    800: 'oklch(0.40 0.09 228)',
    900: 'oklch(0.32 0.07 228)',
  },
} as const;

/** 범용 색상 (white / black). */
export const commonColors = {
  black: 'oklch(0 0 0)',
  white: 'oklch(1 0 0)',
} as const;

/**
 * :root 스칼라 — 색이 아닌 루트 변수. 앱 스킨이 오버라이드하는 지점.
 * brand-hue: 브랜드 램프 hue(기본 코발트 265). 앱 globals.css에서 이 값만 바꾸면 리스킨된다.
 */
export const rootScalars = {
  'brand-hue': '265',
} as const;

export type ThemeColorScale = keyof typeof themeColors;
