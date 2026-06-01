/**
 * Atomic 색상 팔레트 (themeColors / commonColors).
 * 기본 색상 스케일이며, semantic 색상(colors.ts)의 기반이 된다.
 * primary는 indigo 스케일의 800(#10069f)을 앵커로 한다.
 */
export const themeColors = {
  gray: {
    50: '#f8f8fb',
    100: '#eeeef3',
    200: '#dcdce6',
    300: '#c2c2d2',
    400: '#9a9ab0',
    500: '#6f6f88',
    600: '#565669',
    700: '#3f3f4e',
    800: '#242433',
    900: '#0f0f18',
  },
  indigo: {
    50: '#f1f0fe',
    100: '#e1defd',
    200: '#c6c0fb',
    300: '#a59cf8',
    400: '#8579f3',
    500: '#6450ea',
    600: '#4a2fe0',
    700: '#3115c4',
    800: '#10069f',
    900: '#0a0570',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  green: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
} as const;

/** 범용 색상 (white / black). */
export const commonColors = {
  black: '#000000',
  white: '#ffffff',
} as const;

export type ThemeColorScale = keyof typeof themeColors;
