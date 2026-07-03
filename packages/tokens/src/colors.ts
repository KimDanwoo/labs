import { commonColors as c, themeColors as t } from './palette';

/**
 * Semantic 색상 — atomic 팔레트(palette.ts, OKLCH)를 역할로 alias 한다(2-tier).
 * 이 맵이 codegen 입력이며 light/dark 두 값을 갖는다.
 *
 * 역할: primary / secondary / success / error / warning / info + 표면·폼·이펙트.
 * primary·accent·ring·glow 는 brand 램프를 참조 → `--brand-hue` 회전에 함께 반응(스킨).
 * 다크는 밝은 스텝을 base로 올리고 foreground를 어둡게 뒤집어 대비를 확보한다.
 */
export const colors = {
  // Primary — brand 램프(기본 코발트, hue 회전으로 리스킨)
  primary: { light: t.brand[600], dark: t.brand[400] },
  'primary-foreground': { light: c.white, dark: t.gray[900] },
  'primary-accent': { light: t.brand[500], dark: t.brand[300] },
  'primary-subtle': { light: t.brand[50], dark: 'oklch(0.30 0.05 var(--brand-hue))' },

  // Accent 표면 — 브랜드 연한 틴트 표면 + 그 위 글자색(프딥 호환)
  accent: { light: t.brand[50], dark: 'oklch(0.30 0.05 var(--brand-hue))' },
  'accent-foreground': { light: t.brand[700], dark: t.brand[200] },

  // Secondary — 중립 gray. shadcn 규칙: secondary=연한 표면, foreground=그 위 텍스트.
  secondary: { light: t.gray[100], dark: t.gray[800] },
  'secondary-foreground': { light: t.gray[700], dark: t.gray[200] },
  'secondary-subtle': { light: t.gray[50], dark: t.gray[900] },

  // Success — green
  success: { light: t.green[600], dark: t.green[400] },
  'success-foreground': { light: c.white, dark: t.green[900] },
  'success-subtle': { light: t.green[50], dark: 'oklch(0.30 0.05 152)' },

  // Error — red
  error: { light: t.red[600], dark: t.red[400] },
  'error-foreground': { light: c.white, dark: 'oklch(0.25 0.04 27)' },
  'error-subtle': { light: t.red[50], dark: 'oklch(0.30 0.05 27)' },

  // Warning — amber
  warning: { light: t.amber[700], dark: t.amber[400] },
  'warning-foreground': { light: c.white, dark: 'oklch(0.25 0.03 55)' },
  'warning-subtle': { light: t.amber[100], dark: 'oklch(0.32 0.05 60)' },

  // Info — sky
  info: { light: t.sky[600], dark: t.sky[400] },
  'info-foreground': { light: c.white, dark: 'oklch(0.25 0.04 228)' },
  'info-subtle': { light: t.sky[100], dark: 'oklch(0.30 0.05 228)' },

  // 중성색 / 표면 (gray 기반, brand와 같은 쿨톤 가족)
  // muted 계열은 shadcn 규칙: muted=흐린 표면, muted-foreground=그 위 흐린 텍스트.
  background: { light: c.white, dark: t.gray[900] },
  foreground: { light: t.gray[900], dark: t.gray[100] },
  muted: { light: t.gray[100], dark: t.gray[800] },
  'muted-foreground': { light: t.gray[600], dark: t.gray[400] },
  card: { light: c.white, dark: t.gray[800] },
  'card-foreground': { light: t.gray[900], dark: t.gray[100] },
  'card-border': { light: t.gray[200], dark: t.gray[700] },
  popover: { light: c.white, dark: t.gray[800] },
  'popover-foreground': { light: t.gray[900], dark: t.gray[100] },

  // 폼/라인
  border: { light: t.gray[200], dark: t.gray[700] },
  input: { light: t.gray[200], dark: t.gray[700] },
  ring: { light: t.brand[600], dark: t.brand[400] },

  // 이펙트 (brand hue 인식)
  glass: { light: 'oklch(1 0 0 / 0.72)', dark: 'oklch(0.20 0.018 264 / 0.6)' },
  'glass-border': { light: 'oklch(0.145 0.018 264 / 0.08)', dark: 'oklch(1 0 0 / 0.08)' },
  glow: {
    light: 'oklch(0.48 0.20 var(--brand-hue) / 0.16)',
    dark: 'oklch(0.66 0.16 var(--brand-hue) / 0.18)',
  },
  'glow-strong': {
    light: 'oklch(0.48 0.20 var(--brand-hue) / 0.3)',
    dark: 'oklch(0.66 0.16 var(--brand-hue) / 0.32)',
  },

  // 테마 토글 장식색 — 스위치의 낮/밤 상태에 고정(앱 테마와 무관 → light=dark 동일값).
  // 값은 Tailwind 팔레트 oklch(sky/amber/indigo). 여기 한 곳만 바꾸면 전 앱 토글이 함께 바뀐다.
  'toggle-day-start': { light: 'oklch(0.901 0.058 230.902)', dark: 'oklch(0.901 0.058 230.902)' }, // sky-200
  'toggle-day-end': { light: 'oklch(0.924 0.12 95.746)', dark: 'oklch(0.924 0.12 95.746)' }, // amber-200
  'toggle-night': { light: 'oklch(0.257 0.09 281.288)', dark: 'oklch(0.257 0.09 281.288)' }, // indigo-950
  'toggle-thumb': { light: c.white, dark: c.white }, // 낮 썸
  'toggle-thumb-night': { light: 'oklch(0.93 0.034 272.788)', dark: 'oklch(0.93 0.034 272.788)' }, // indigo-100
  'toggle-sun': { light: 'oklch(0.769 0.188 70.08)', dark: 'oklch(0.769 0.188 70.08)' }, // amber-500
  'toggle-moon': { light: 'oklch(0.511 0.262 276.966)', dark: 'oklch(0.511 0.262 276.966)' }, // indigo-600
} as const;

export type ColorToken = keyof typeof colors;
export type ThemeMode = 'light' | 'dark';
