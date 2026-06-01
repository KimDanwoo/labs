import { commonColors as c, themeColors as t } from './palette';

/**
 * Semantic 색상 — atomic 팔레트(palette.ts)를 의미 있는 역할로 alias 한다(2-tier).
 * 이 맵이 codegen의 입력이며 light/dark 두 값을 함께 갖는다.
 *
 * 역할: primary / secondary / success / error / warning / info.
 * 각 역할 = base(솔리드) · foreground(위 글자색) · subtle(연한 배경 틴트).
 * 다크는 atomic의 밝은 스텝을 base로 올리고 foreground를 어둡게 뒤집어 대비를 확보한다.
 * primary = indigo[800](#10069f) 앵커.
 */
export const colors = {
  // Primary — indigo (#10069f)
  primary: { light: t.indigo[800], dark: t.indigo[400] },
  'primary-foreground': { light: c.white, dark: t.gray[900] },
  'primary-accent': { light: t.indigo[600], dark: t.indigo[300] },
  'primary-subtle': { light: t.indigo[50], dark: '#1b1340' },

  // Secondary — slate
  secondary: { light: t.slate[600], dark: t.slate[400] },
  'secondary-foreground': { light: c.white, dark: t.gray[900] },
  'secondary-subtle': { light: t.slate[100], dark: t.slate[800] },

  // Success — green
  success: { light: t.green[600], dark: t.green[400] },
  'success-foreground': { light: c.white, dark: t.green[900] },
  'success-subtle': { light: t.green[50], dark: '#0c2a1e' },

  // Error — red
  error: { light: t.red[600], dark: t.red[400] },
  'error-foreground': { light: c.white, dark: '#2a0a0a' },
  'error-subtle': { light: t.red[50], dark: '#2c1414' },

  // Warning — amber
  warning: { light: t.amber[700], dark: t.amber[400] },
  'warning-foreground': { light: c.white, dark: '#2a1c02' },
  'warning-subtle': { light: t.amber[100], dark: '#2a2008' },

  // Info — sky
  info: { light: t.sky[600], dark: t.sky[400] },
  'info-foreground': { light: c.white, dark: '#052437' },
  'info-subtle': { light: t.sky[100], dark: '#082a3a' },

  // 중성색 / 표면 (gray 기반, primary와 같은 쿨톤 가족)
  background: { light: c.white, dark: t.gray[900] },
  foreground: { light: t.gray[900], dark: t.gray[100] },
  muted: { light: t.gray[500], dark: t.gray[400] },
  card: { light: c.white, dark: t.gray[800] },
  'card-border': { light: t.gray[200], dark: t.gray[700] },
  glass: { light: 'rgba(255, 255, 255, 0.72)', dark: 'rgba(36, 36, 51, 0.6)' },
  'glass-border': { light: 'rgba(15, 15, 24, 0.08)', dark: 'rgba(255, 255, 255, 0.08)' },
  glow: { light: 'rgba(100, 80, 234, 0.16)', dark: 'rgba(133, 121, 243, 0.18)' },
} as const;

export type ColorToken = keyof typeof colors;
export type ThemeMode = 'light' | 'dark';
