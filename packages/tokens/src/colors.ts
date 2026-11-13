import { commonColors as c, themeColors as t } from './palette';

export const colors = {
  primary: { light: t.brand[600], dark: t.brand[400] },
  'primary-foreground': { light: c.white, dark: t.gray[900] },
  'primary-accent': { light: t.brand[500], dark: t.brand[300] },
  'primary-subtle': { light: t.brand[50], dark: 'oklch(0.30 0.05 var(--brand-hue))' },

  accent: { light: t.brand[50], dark: 'oklch(0.30 0.05 var(--brand-hue))' },
  'accent-foreground': { light: t.brand[700], dark: t.brand[200] },

  secondary: { light: t.gray[100], dark: t.gray[800] },
  'secondary-foreground': { light: t.gray[700], dark: t.gray[200] },
  'secondary-subtle': { light: t.gray[50], dark: t.gray[900] },

  // 상태색(success·warning·info·error)의 라이트 값은 각자의 subtle 배경 위 글자 대비가 4.5:1(WCAG AA) 이상이다.
  success: { light: t.green[700], dark: t.green[400] },
  'success-foreground': { light: c.white, dark: t.green[900] },
  'success-subtle': { light: t.green[50], dark: 'oklch(0.30 0.05 152)' },

  error: { light: t.red[600], dark: t.red[400] },
  'error-foreground': { light: c.white, dark: 'oklch(0.25 0.04 27)' },
  'error-subtle': { light: t.red[50], dark: 'oklch(0.30 0.05 27)' },

  warning: { light: t.amber[800], dark: t.amber[400] },
  'warning-foreground': { light: c.white, dark: 'oklch(0.25 0.03 55)' },
  'warning-subtle': { light: t.amber[100], dark: 'oklch(0.32 0.05 60)' },

  info: { light: t.sky[700], dark: t.sky[400] },
  'info-foreground': { light: c.white, dark: 'oklch(0.25 0.04 228)' },
  'info-subtle': { light: t.sky[100], dark: 'oklch(0.30 0.05 228)' },

  background: { light: c.white, dark: t.gray[900] },
  foreground: { light: t.gray[900], dark: t.gray[100] },
  muted: { light: t.gray[100], dark: t.gray[800] },
  'muted-foreground': { light: t.gray[600], dark: t.gray[400] },
  card: { light: c.white, dark: t.gray[800] },
  'card-foreground': { light: t.gray[900], dark: t.gray[100] },
  'card-border': { light: t.gray[200], dark: t.gray[700] },
  popover: { light: c.white, dark: t.gray[800] },
  'popover-foreground': { light: t.gray[900], dark: t.gray[100] },

  border: { light: t.gray[200], dark: t.gray[700] },
  input: { light: t.gray[200], dark: t.gray[700] },
  ring: { light: t.brand[600], dark: t.brand[400] },

  glass: { light: 'oklch(1 0 0 / 0.72)', dark: 'oklch(0.20 0.018 264 / 0.6)' },
  'glass-border': { light: 'oklch(0.145 0.018 264 / 0.08)', dark: 'oklch(1 0 0 / 0.08)' },
  glow: {
    light: 'oklch(0.48 0.20 var(--brand-hue) / 0.16)',
    dark: 'oklch(0.66 0.16 var(--brand-hue) / 0.18)',
  },

  // 테마 토글 장식색 — 스위치의 낮/밤 상태에 고정(앱 테마와 무관 → light=dark 동일값).
  'toggle-day-start': { light: 'oklch(0.901 0.058 230.902)', dark: 'oklch(0.901 0.058 230.902)' },
  'toggle-day-end': { light: 'oklch(0.924 0.12 95.746)', dark: 'oklch(0.924 0.12 95.746)' },
  'toggle-night': { light: 'oklch(0.257 0.09 281.288)', dark: 'oklch(0.257 0.09 281.288)' },
  'toggle-thumb': { light: c.white, dark: c.white },
  'toggle-thumb-night': { light: 'oklch(0.93 0.034 272.788)', dark: 'oklch(0.93 0.034 272.788)' },
  'toggle-sun': { light: 'oklch(0.769 0.188 70.08)', dark: 'oklch(0.769 0.188 70.08)' },
  'toggle-moon': { light: 'oklch(0.511 0.262 276.966)', dark: 'oklch(0.511 0.262 276.966)' },
} as const;

export type ColorToken = keyof typeof colors;
export type ThemeMode = 'light' | 'dark';
